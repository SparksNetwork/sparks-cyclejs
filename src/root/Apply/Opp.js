import './styles.scss'

import {Observable} from 'rx'
const {just, merge, combineLatest} = Observable
import {not, find, propEq} from 'ramda'

import {h5, a} from 'cycle-snabbdom'
import {div} from 'helpers'
import {combineLatestToDiv, combineDOMsToDiv, switchStream} from 'util'

import {CommitmentItemPassive} from 'components/commitment'

import {
  ListItemHeader,
  ListWithHeader,
  RaisedButton,
} from 'components/sdm'

import {Commitments, Engagements} from 'components/remote'

import {DescriptionListItem} from 'components/ui'

import {codePriority} from 'components/commitment'

import Overview, {calculateDiscount} from './Overview'

const CommitmentListPassive = sources => ListWithHeader({...sources,
  headerDOM: ListItemHeader(sources).DOM,
  Control$: just(CommitmentItemPassive),
  rows$: sources.rows$.map(a =>
    a.sort((a,b) => codePriority[a.code] - codePriority[b.code])
  ),
})

function Page(sources) {
  const discount$ = sources.commitments$.map(calculateDiscount)

  const applyNow = RaisedButton({...sources,
    label$: just('Apply Now!'),
  })

  const gives = CommitmentListPassive({...sources,
    title$: just('you GIVE'),
    rows$: sources.commitments$
      .map(cs => cs.filter(({party}) => party === 'vol')),
  })

  const gets = CommitmentListPassive({...sources,
    title$: just('you GET'),
    rows$: sources.commitments$
      .map(cs => cs.filter(({party}) => party === 'org'))
      .combineLatest(discount$,
        (x, y) => [{code: 'discount', amount: y}].concat(x)),
  })

  const needHelp = DescriptionListItem({...sources,
    title$: just(div({},[
      'questions?  need help?  email to ',
      a({attrs: {href: 'mailto:help@sparks.network'}}, ['help@sparks.network']),
    ])),
  })

  const route$ = merge(
    sources.oppKey$.map(oppKey =>
      `/applyTo/${oppKey}`)
      .sample(applyNow.click$),
  ).share()

  const informationDOM = combineDOMsToDiv('',
    gives,
    {DOM: gets.DOM.map(view => div({
      style: {marginTop: '2em', marginBottom: '2em'}}, [view]))},
  )

  const alreadyAppliedDOM = combineLatest(
      sources.priorEngagmentForOpp$.filter(Boolean)
    )
    .map(() => h5('You\'ve already applied for this opportunity!'))

  const applyDOM = combineLatest(
      sources.priorEngagmentForOpp$.filter(not)
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

function fetch(sources) {
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

  return {...sources,
    commitments$,
    priorEngagmentForOpp$,
  }
}

export default sources => {
  const o = Overview(sources)
  const p = Page(fetch(sources))
  const childs = [o, p]

  return {
    DOM: combineLatest(childs.map(c => c.DOM), (...doms) => div(doms)),
    route$: o.route$,
  }
}
