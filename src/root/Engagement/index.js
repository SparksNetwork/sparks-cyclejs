import {Observable as $} from 'rx'
import {
  not,
} from 'ramda'
import moment from 'moment'

import AppFrame from 'components/AppFrame'
import {TabbedTitle} from 'components/Title'
import {Recommend} from 'components/ui/Facebook'

import {
  TabbedPage,
} from 'components/ui'

import {log} from 'util'
import {mergeOrFlatMapLatest} from 'util'

import {div} from 'helpers'

import {
  Memberships,
  Commitments,
  Opps,
  Projects,
  ProjectImages,
  Shifts,
  Assignments,
} from 'components/remote'

const extractAmount = s => parseInt(('' + s).replace(/[^0-9\.]/g, ''), 10)

const _Fetch = sources => {
  const engagement$ = sources.engagementKey$
    .flatMapLatest(key => sources.firebase('Engagements',key))

  const oppKey$ = engagement$.pluck('oppKey')

  const assignments$ = sources.engagementKey$
    .flatMapLatest(Assignments.query.byEngagement(sources))
    .tap(log('assignments$'))

  const shifts$ = assignments$
    .map(arr => arr.map(a => Shifts.query.one(sources)(a.shiftKey)))
    // .tap(log('shifts$ passed to query'))
    .shareReplay(1)
    .flatMapLatest(oarr => oarr.length > 0 ?
        $.combineLatest(...oarr) :
        $.of([])
    )
    // .tap(log('shifts$ from assignments$'))
    .map(arr => arr.sort((a,b) => moment(a.start) - moment(b.start)))
    .shareReplay(1)

  const commitments$ = oppKey$
    .flatMapLatest(Commitments.query.byOpp(sources))

  const commitmentPayment$ = commitments$
    .map(col => col.filter(c => c.code === 'payment'))
    .map(col => col.length >= 1 ? col[0] : 0)

  const commitmentDeposit$ = commitments$
    .map(col => col.filter(c => c.code === 'deposit'))
    .map(col => col.length >= 1 ? col[0] : 0)

  const commitmentShifts$ = commitments$
    .map(col => col.filter(c => c.code === 'shifts'))
    .map(col => parseInt(col.length >= 1 ? col[0].count : 0, 10))
    .shareReplay(1)
    .tap(log('commitmentShifts$'))

  const amountPayment$ = commitmentPayment$
    .map(({amount}) => extractAmount(amount || 0))

  const amountDeposit$ = commitmentDeposit$
    .map(({amount}) => extractAmount(amount || 0))

  const amountSparks$ = $.combineLatest(
    amountPayment$,
    amountDeposit$,
    (pmt, dep) =>
      pmt + dep > 0 ?
      (pmt + dep) * 0.035 + 1.0 :
      0
  ).map(amt => +amt.toFixed(2))

  const amountNonrefund$ = $.combineLatest(
    amountPayment$,
    amountSparks$,
    (pmt, sp) => pmt + sp
  )

  const hasDeposit$ = amountDeposit$
    .map(amt => amt > 0)

  const hasNonrefund$ = amountNonrefund$
    .map(amt => amt > 0)

  const hasPayment$ = amountPayment$
    .map(amt => amt > 0)

  const opp$ = oppKey$
    .flatMapLatest(Opps.query.one(sources))

  const projectKey$ = opp$.pluck('projectKey')

  const project$ = projectKey$
    .flatMapLatest(Projects.query.one(sources))

  const projectImage$ = projectKey$
    .flatMapLatest(ProjectImages.query.one(sources))

  const memberships$ = sources.engagementKey$
    .flatMapLatest(Memberships.query.byEngagement(sources))

  const isConfirmed$ = engagement$.pluck('isConfirmed')

  const isApplicationComplete$ = $.combineLatest(
    engagement$.map(({answer}) => !!answer),
    memberships$.map(m => m.length > 0),
    (ans, len) => ans && len,
  )

  const requiredAssignments$ = commitments$
    .map(c => c.filter(x => x.code === 'shifts'))
    .map(a => a[0] && a[0].count || 0)

  const selectedAssignments$ = assignments$
    .map(c => c.length)

  const neededAssignments$ = $.combineLatest(
    requiredAssignments$, selectedAssignments$,
    (r,s) => r - s
  )

  const engagementUrl$ = sources.engagementKey$
    .map(k => `/engaged/${k}`)

  return {
    engagement$,
    oppKey$,
    assignments$,
    shifts$,
    commitments$,
    commitmentPayment$,
    commitmentDeposit$,
    commitmentShifts$,
    opp$,
    projectKey$,
    project$,
    projectImage$,
    memberships$,
    amountPayment$,
    amountDeposit$,
    amountSparks$,
    amountNonrefund$,
    isConfirmed$,
    isApplicationComplete$,
    requiredAssignments$,
    selectedAssignments$,
    neededAssignments$,
    engagementUrl$,
    hasDeposit$,
    hasNonrefund$,
    hasPayment$,
  }
}

import Priority from './Priority/index.js'
import Application from './Application'
import Confirmation from './Confirmation/index.js'

import {label} from 'components/engagement'

const Engagement = sources => {
  const _sources = {...sources, ..._Fetch(sources)}

  // const nav = ProfileSidenav(_sources)

  const tabs$ = _sources.engagement$.map(({isAccepted}) => [
    {path: '/', label: 'Priority'},
    {path: '/application', label: 'Application'},
    isAccepted && {path: '/confirmation', label: 'Confirmation'},
  ].filter(x => !!x))

  const page = TabbedPage({..._sources,
    tabs$,
    routes$: $.of({
      '/': Priority,
      '/application': Application,
      '/confirmation': Confirmation,
    }),
  })

  const title = TabbedTitle({..._sources,
    tabsDOM$: page.tabBarDOM,
    titleDOM$: _sources.project$.pluck('name'),
    rightDOM$: Recommend({
      ...sources,
      path$: $.combineLatest(
        _sources.projectKey$,
        _sources.oppKey$
      ).map(([projectKey, oppKey]) => `/apply/${projectKey}/opp/${oppKey}`),
    }).DOM,
    subtitleDOM$: $.combineLatest(
      _sources.opp$.pluck('name'),
      _sources.engagement$.map(label),
      (name,lab) => `${name} | ${lab}`
    ),
    backgroundUrl$: _sources.projectImage$.map(i => i && i.dataUrl),
  })

  const frame = AppFrame({..._sources,
    navDOM: sources.navDOM$,
    pageDOM: $.combineLatest(
      title.DOM, page.DOM,
      (...doms) => div('', doms)
    ),
  })

  // const children = [frame, page, nav]
  const children = [frame, page]

  const redirectOnLogout$ = _sources.auth$.filter(not).map(() => '/')

  const route$ = $.merge(
    mergeOrFlatMapLatest('route$', ...children),
    redirectOnLogout$,
  )

  return {
    DOM: frame.DOM,
    auth$: mergeOrFlatMapLatest('auth$', ...children),
    queue$: mergeOrFlatMapLatest('queue$', ...children),
    route$,
    openAndPrint: page.openAndPrint,
  }
}

export default Engagement
