import './styles.scss'

import {Observable} from 'rx'
const {just, merge, combineLatest} = Observable
import {not, find, propEq} from 'ramda'

import {h5, a, h} from 'cycle-snabbdom'
import {div} from 'helpers'
import {combineLatestToDiv, combineDOMsToDiv, switchStream} from 'util'

import {CommitmentItemPassive} from 'components/commitment'

import {
  List,
  ListItemNavigating,
  ListItemHeader,
  ListWithHeader,
  RaisedButton,
} from 'components/sdm'

import {Commitments, Engagements} from 'components/remote'

import {TitleListItem, DescriptionListItem} from 'components/ui'

import {codePriority} from 'components/commitment'

const CommitmentListPassive = sources => ListWithHeader({...sources,
  headerDOM: ListItemHeader(sources).DOM,
  Control$: just(CommitmentItemPassive),
  rows$: sources.rows$.map(a =>
    a.sort((a,b) => codePriority[a.code] - codePriority[b.code])
  ),
})

const _Title = sources => TitleListItem({...sources,
  title$: just('Check out these Opportunities!'),
})

function radioButton(sources) {
  const isCurrent$ = combineLatest(
    sources.router.observable, sources.item$.pluck('$key'),
    (route, itemKey) => itemKey === route.pathname.split('/opp/')[1])

  return isCurrent$.map(isCurrent => {
    return h('svg', {
      ns: 'http://www.w3.org/2000/svg',
      attrs: {
        width: '64px',
        height: '64px',
        margin: '0 auto',
      },
    }, [
      h('circle', {
        ns: 'http://www.w3.org/2000/svg',
        style: {
          borderWidth: '3px',
        },
        attrs: {
          cx: '32',
          cy: '32',
          r: '14',
          stroke: '#FFC107',
          'stroke-width': '3',
          fill: 'transparent',
        },
      }, []),

      isCurrent ? h('circle', {
        attrs: {
          cx: '32',
          cy: '32',
          r: '8',
          stroke: 'transparent',
          fill: '#FFC107',
        },
      }, []) : h('div'),
    ])
  })
}

const _Item = sources => ListItemNavigating({...sources,
  title$: sources.item$.pluck('name'),
  subtitle$: sources.item$.pluck('description'),
  leftDOM$: radioButton(sources),
  path$: combineLatest(sources.router.observable, sources.item$.pluck('$key'),
    (location, itemKey) => {
      return location.pathname.split('/opp/')[0] + '/opp/' + itemKey
    }),
})

const _List = sources => List({...sources,
  rows$: sources.opps$,
  Control$: just(_Item),
})

function Page(sources) {
  // get the remote data we need
  const oppKey$ = sources.oppKey$

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
    oppKey$.map(oppKey =>
      `/applyTo/${oppKey}`)
      .sample(applyNow.click$),
  ).share()

  const informationDOM = combineDOMsToDiv('',
    gives,
    {DOM: gets.DOM.map(view => div({
      style: {marginTop: '2em', marginBottom: '2em'}}, [view]))},
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
    DOM: DOM.map(view => div({style: {marginTop: '3em'}}, [view])),
    route$,
  }
}

export default sources => {
  const t = _Title(sources)
  const l = _List(sources)
  const p = Page(sources)
  const childs = [t, l, p]

  return {
    DOM: combineLatest(childs.map(c => c.DOM),
      (...doms) => div({style: {marginTop: '2em'}},doms)),
    route$: l.route$.share(),
  }
}
