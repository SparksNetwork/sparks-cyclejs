import {Observable} from 'rx'
const {just, merge, combineLatest} = Observable
import {not, find, propEq, reduce} from 'ramda'

import {h5, a} from 'cycle-snabbdom'
import {div} from 'helpers'
import {combineLatestToDiv, combineDOMsToDiv, switchStream} from 'util'

import {CommitmentList, CommitmentItemPassive} from 'components/commitment'

import {
  ListItem,
  ListItemHeader,
  ListWithHeader,
  RaisedButton,
  SelectControl,
} from 'components/sdm'

import {
  Opps,
  Commitments,
  Engagements,
} from 'components/remote'

import {
  QuotingListItem,
  TitleListItem,
  DescriptionListItem,
} from 'components/ui'

const _Select = sources => SelectControl({...sources,
  label$: just('Choose another opportunity...'),
  options$: sources.opps$.map(opps => [
    // {value: 0, label: 'Choose another opportunity...'},
    ...opps.map(({name,$key}) => ({value: $key, label: name})),
  ]),
  value$: just(false),
})

const Chooser = sources => {
  const projectKey$ = sources.projectKey$.share()
  const opps$ = sources.opps$.shareReplay(1)
  const select = _Select({...sources, opps$})
  const li = ListItem({...sources,
    projectKey$,
    opps$,
    title$: select.DOM,
  })

  const route$ = select.value$
    .filter(v => !!v)
    .withLatestFrom(
      projectKey$,
      (ok, pk) => `/apply/${pk}/opp/${ok}`
    ).share()

  return {
    DOM: li.DOM,
    route$,
  }
}

const Title = sources => TitleListItem({...sources,
  title$: sources.opp$.pluck('name'),
})

const Quote = sources => QuotingListItem({...sources,
  title$: sources.opp$.map(({description}) => description || 'No Description'),
  profileKey$: sources.project$.pluck('ownerProfileKey'),
})

const Discount = sources => ListItem({...sources,
  title$: sources.discount$.map(d =>
    (d > 0 ?
      `This volunteer program gets you a $${d} discount off the retail price for this event, and lots of other perks.` :
      'Help out this project by contributing your time and effort.'
    ) +
    ' Applying for this opportunity is totally free! '
  ),
})

import {codePriority} from 'components/commitment'

const CommitmentListPassive = sources => ListWithHeader({...sources,
  headerDOM: ListItemHeader(sources).DOM,
  Control$: just(CommitmentItemPassive),
  rows$: sources.rows$.map(a =>
    a.sort((a,b) => codePriority[a.code] - codePriority[b.code])
  ),
})

export default sources => {
  // get the remote data we need
  const oppKey$ = sources.oppKey$

  const opp$ = oppKey$
    .flatMapLatest(Opps.query.one(sources))

  const commitments$ = oppKey$
    .flatMapLatest(Commitments.query.byOpp(sources))

  const userEngagments$ = sources.userProfileKey$
    .flatMapLatest(Engagements.query.byUser(sources))

  const priorEngagmentForOpp$ = switchStream(sources.auth$, Boolean,
    () => combineLatest(
      userEngagments$,
      oppKey$,
      (engs, oppKey) => find(propEq('oppKey', oppKey))(engs)),
    () => just(null),
  )

  const discount$ = commitments$.map(reduce((a,x) => {
    console.log('commitment reducing', x)
    if (x.code === 'ticket') {
      return a + (Number(x.retailValue) || 0)
    }
    if (x.code === 'payment') {
      return a - (Number(x.amount) || 0)
    }
    return a
  }, 0))
  .tap(d => console.log('discount', d))

  const _sources = {...sources, opp$, oppKey$, commitments$, discount$}

  // delegate to controls
  const title = Title(_sources)
  const chooser = Chooser(_sources)
  const desc = Quote(_sources)
  const discount = Discount(_sources)

  const applyNow = RaisedButton({...sources,
    label$: just('Apply Now!'),
  })

  const gives = CommitmentListPassive({...sources,
    title$: just('you GIVE'),
    rows$: commitments$.map(cs => cs.filter(({party}) => party === 'vol')),
  })

  const gets = CommitmentListPassive({...sources,
    title$: just('you GET'),
    rows$: commitments$.map(cs => cs.filter(({party}) => party === 'org')),
  })

  const needHelp = DescriptionListItem({...sources,
    title$: just(div({},[
      'questions?  need help?  email to ',
      a({attrs: {href: 'mailto:help@sparks.network'}}, ['help@sparks.network']),
    ])),
  })

  const route$ = merge(
    chooser.route$,
    oppKey$.map(oppKey =>
      `/applyTo/${oppKey}`)
      .sample(applyNow.click$),
  ).share()

  const informationDOM = combineDOMsToDiv('',
    title,
    chooser,
    desc,
    discount,
    gives,
    gets,
  )

  const alreadyAppliedDOM = combineLatest(
      priorEngagmentForOpp$.filter(Boolean)
    )
    .map(() => h5('You\'ve already applied for this opportunity!'))

  const applyDOM = combineLatest(
      priorEngagmentForOpp$.filter(not)
    )
    .flatMapLatest(() => applyNow.DOM)

  const actionDOM = merge(
    alreadyAppliedDOM,
    applyDOM
  )

  const DOM = combineLatestToDiv(
    informationDOM,
    actionDOM,
    needHelp.DOM
  )

  return {
    DOM,
    route$,
  }
}
