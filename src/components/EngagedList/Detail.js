import {Observable as $} from 'rx'
const {just, merge} = $
// import {log} from 'util'
import {combineDOMsToDiv} from 'util'
import {objOf, prop} from 'ramda'

import {
  ActionButton,
} from 'components/ui'

import {
  FlatButton,
  TitledCard,
  LargeCard,
} from 'components/sdm'

import ProfileInfo from './ProfileInfo'
import EngagementInfo from './EngagementInfo'
import TeamsInfo from './TeamsInfo'
import ShiftsInfo from './ShiftsInfo'

import {
  Assignments,
  Engagements,
  Memberships,
  Profiles,
} from 'components/remote'

import {hideable} from 'util'

const Fetch = component => sources => {
  const engagement$ = sources.engagementKey$
    .flatMapLatest(Engagements.query.one(sources))
    .shareReplay(1)
  const profile$ = engagement$.map(prop('profileKey'))
    .flatMapLatest(Profiles.query.one(sources))
    .shareReplay(1)
  const memberships$ = sources.engagementKey$
    .flatMapLatest(Memberships.query.byEngagement(sources))
    .shareReplay(1)
  const assignments$ = sources.engagementKey$
    .flatMapLatest(Assignments.query.byEngagement(sources))
    .shareReplay(1)

  return component({
    profile$,
    engagement$,
    memberships$,
    assignments$,
    ...sources,
  })
}

const _Accept = sources => ActionButton({...sources,
  label$: just('OK'),
  params$: just({isAccepted: true, priority: false, declined: false}),
})

const _Decline = sources => ActionButton({...sources,
  label$: just('never'),
  params$: just({isAccepted: false, priority: false, declined: true}),
  classNames$: just(['red']),
})

const _Remove = sources => hideable(ActionButton)({...sources,
  label$: just('Delete'),
  params$: just({isAccepted: false, priority: false, declined: true}),
  classNames$: just(['black']),
  isVisible$: sources.userProfile$.pluck('isAdmin'),
})

const _Actions = (sources) => {
  const ac = _Accept(sources)
  const dec = _Decline(sources)
  const rem = _Remove(sources)

  return {
    DOM: combineDOMsToDiv('.center', ac, dec, rem),
    action$: $.merge(ac.action$, dec.action$),
    remove$: rem.action$,
  }
}

const _Navs = sources => {
  const prev = FlatButton({...sources, label$: just('<')})
  const close = FlatButton({...sources, label$: just('CLOSE')})
  const next = FlatButton({...sources, label$: just('>')})

  const route$ = merge(
    sources.engagementKey$.map(k => [k, -1])
      .sample(prev.click$),
    sources.engagementKey$.map(k => [k, 0])
      .sample(close.click$),
    sources.engagementKey$.map(k => [k, 1])
      .sample(next.click$),
  )

  return {
    DOM: combineDOMsToDiv('.center', prev, close, next),
    route$,
  }
}

const _Scrolled = sources => {
  const teamsInfo = TeamsInfo(sources)
  const shiftsInfo = ShiftsInfo(sources)

  return {
    DOM: combineDOMsToDiv('.scrollable',
      ProfileInfo(sources),
      EngagementInfo(sources),
      teamsInfo,
      shiftsInfo,
    ),
    queue$: merge(teamsInfo.queue$, shiftsInfo.queue$),
    hasBeenAccepted$: teamsInfo.hasBeenAccepted$,
    route$: teamsInfo.route$,
  }
}

const _Content = sources => {
  const acts = _Actions(sources)
  const scr = _Scrolled(sources)

  const action$ = acts.action$
  .withLatestFrom(scr.hasBeenAccepted$,
    (action, hasBeenAccepted) => hasBeenAccepted || action.declined ?
      action : false
  )
  .filter(Boolean)

  const DOM = combineDOMsToDiv('', scr, acts)

  return {
    DOM,
    remove$: acts.remove$,
    queue$: scr.queue$,
    action$,
    route$: scr.route$,
  }
}

const switchRoute = ([eKey, relative], oppKey, engs) => {
  if (relative === 0 || engs.length <= 1) {
    return ``
  }
  let idx = engs.findIndex(e => e.$key === eKey) + relative
  console.log('looking for', idx, engs.length)
  if (idx < 0) { idx = engs.length - 1 }
  if (idx >= engs.length) { idx = 0 }
  console.log('changed to', idx)
  const newKey = engs[idx].$key
  return `/show/${newKey}`
}

const Detail = sources => {
  const navs = _Navs(sources)
  const c = _Content(sources)

  const card = TitledCard({
    ...sources,
    cardComponent: LargeCard,
    title$: sources.profile$.map(prop('fullName')),
    content$: $.combineLatest(c.DOM, navs.DOM),
  })

  const route$ = merge(
    navs.route$,
    sources.engagementKey$.map(k => [k, 1]).sample(c.action$),
    sources.engagementKey$.map(k => [k, 1]).sample(c.remove$),
  )
  .combineLatest(
    sources.oppKey$,
    sources.engagements$,
    (r, key, engs) => switchRoute(r, key, engs)
  ).merge(c.route$)

  const action$ = c.action$
    .withLatestFrom(sources.engagementKey$,
      (values, key) => ({key, values})
    )
    .map(Engagements.action.update)

  const remove$ = c.remove$
    .withLatestFrom(sources.engagementKey$,
      (values, key) => key
    )
    .map(objOf('key'))
    .map(Engagements.action.remove)

  const queue$ = merge(action$, remove$, c.queue$)

  return {
    DOM: card.DOM,
    route$,
    queue$,
  }
}

export default function(sources) {
  return Fetch(Detail)({
    ...sources,
    engagementKey$: sources.key$,
  })
}
