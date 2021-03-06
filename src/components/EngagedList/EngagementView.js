import {Observable as $} from 'rx'
const {of, merge, combineLatest} = $
// import {log} from 'util'
import {combineDOMsToDiv} from 'util'
import {
  add, always, apply, equals, flip, ifElse, indexOf, map, modulo, nth, objOf,
  prop, lensPath, set, of as rof,
} from 'ramda'

import {
  ActionButton,
} from 'components/ui'

import {
  LargeCard,
  ListItemHeader,
  Icon,
} from 'components/sdm'

import {Swipeable, Clickable} from 'components/behaviors'

import ProfileInfo from './ProfileInfo'
import OppChange from './OppChange'
import EngagementInfo from './EngagementInfo'
import TeamsInfo from './TeamsInfo'
import ShiftsInfo from './ShiftsInfo'
import {PaymentInfo} from './PaymentInfo'

import {
  Assignments,
  Engagements,
  Memberships,
  Profiles,
  Projects,
  Opps,
  Teams,
} from 'components/remote'

import {hideable, mergeSinks} from 'util'

const superLens = lensPath(['data', 'supernova'])
const keyLens = lensPath(['key'])

const Fetch = component => sources => {
  const engagement$ = sources.engagementKey$
    .flatMapLatest(Engagements.query.one(sources))
    .shareReplay(1)

  const oppKey$ = engagement$.map(prop('oppKey'))

  const opp$ = sources.opp$ || oppKey$.flatMapLatest(Opps.query.one(sources))
    .shareReplay(1)

  const project$ = sources.project$ || opp$.map(prop('projectKey'))
    .flatMapLatest(Projects.query.one(sources))
    .shareReplay(1)

  const teams$ = sources.teams$ || project$.map(prop('$key'))
    .flatMapLatest(Teams.query.byProject(sources))
    .shareReplay(1)

  const opps$ = sources.opps$ || project$.map(prop('$key'))
    .flatMapLatest(Opps.query.byProject(sources))
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

  const approvedMemberships$ = memberships$
    .map(memberships => memberships.filter(m => m.isAccepted))
  const hasApprovedMemberships$ = approvedMemberships$
    .map(memberships => memberships.length > 0)

  return component({
    profile$,
    project$,
    engagement$,
    oppKey$,
    opp$,
    opps$,
    memberships$,
    assignments$,
    hasApprovedMemberships$,
    teams$,
    ...sources,
  })
}

const _Accept = sources => ActionButton({...sources,
  label$: of('Accept'),
  params$: of({isAccepted: true, priority: false, declined: false}),
})

const _Decline = sources => ActionButton({...sources,
  label$: of('Reject'),
  params$: of({isAccepted: false, priority: false, declined: true}),
  classNames$: of(['red']),
})

const _Remove = sources => hideable(ActionButton)({...sources,
  label$: of('Delete'),
  params$: of({isAccepted: false, priority: false, declined: true}),
  classNames$: of(['black']),
  isVisible$: sources.userProfile$.pluck('isAdmin'),
})

const _Actions = (sources) => {
  const ac = _Accept(sources)
  const dec = _Decline(sources)
  const rem = _Remove(sources)

  const DOM = $.combineLatest(
    sources.engagement$,
    sources.hasApprovedMemberships$,
    ({isConfirmed, isAccepted, declined}, hasApprovedMemberships) => {
      if (isConfirmed) { return null }
      if (isAccepted) {
        return combineDOMsToDiv('.center', dec, rem)
      }
      if (declined && hasApprovedMemberships) {
        return combineDOMsToDiv('.center', ac, rem)
      }
      if (declined) {
        return combineDOMsToDiv('.center', rem)
      }
      if (hasApprovedMemberships) {
        return combineDOMsToDiv('.center', ac, dec, rem)
      }
      return combineDOMsToDiv('.center', dec, rem)
    }
  )

  return {
    DOM,
    action$: $.merge(ac.action$, dec.action$),
    remove$: rem.action$,
  }
}

const _Content = sources => {
  const profileInfo = ProfileInfo(sources)
  const oppChange = OppChange(sources)
  const engagementInfo = EngagementInfo(sources)
  const paymentInfo = PaymentInfo(sources)
  const teamsInfo = TeamsInfo(sources)
  const shiftsInfo = ShiftsInfo(sources)
  const acts = _Actions(sources)

  const components = [
    profileInfo,
    oppChange,
    engagementInfo,
    paymentInfo,
    teamsInfo,
    shiftsInfo,
    acts,
  ]

  const action$ = acts.action$
  .withLatestFrom(teamsInfo.hasBeenAccepted$,
    (action, hasBeenAccepted) => hasBeenAccepted || action.declined ?
      action : false
  )
  .filter(Boolean)

  const DOM = combineDOMsToDiv('', ...components)

  return {
    ...mergeSinks(...components),
    DOM,
    remove$: acts.remove$,
    action$,
  }
}

const Engagement = sources => {
  const c = _Content(sources)

  const backButton = Clickable(Icon)({
    ...sources,
    iconName$: of('arrow_back'),
  })

  const header = ListItemHeader({
    ...sources,
    title$: sources.profile$.map(prop('fullName')),
    leftDOM$: backButton.DOM,
  })

  const card = Swipeable(LargeCard)({
    ...sources,
    content$: combineDOMsToDiv('', header, c).map(rof),
  })

  // TODO: This is a sink that emits the position of this engagement in the
  // engagement list, but now this component is used from elsewhere it makes no
  // sense.
  const engagements$ = sources.engagements$ || of([])

  const index$ = combineLatest(
    sources.engagementKey$,
    engagements$.map(map(prop('$key'))),
  )
  .map(apply(indexOf))

  const nextIndex$ = index$.flatMapLatest(index =>
    merge(
      card.swipe$
        .map(ifElse(equals('left'), always(-1), always(1))),
      c.action$.map(always(1)),
      c.remove$.map(always(1))
    )
    .map(add(index))
  )

  const nextEngKey$ = engagements$.flatMapLatest(engs =>
    nextIndex$
      .map(flip(modulo)(engs.length))
      .map(flip(nth)(engs))
      .map(prop('$key'))
  )

  const route$ = merge(
    nextEngKey$.map(sources.createHref.item),
    backButton.click$.map(sources.createHref.list),
    c.route$,
  )

  const DOM = combineLatest(
    sources.profile$.map(prop('$key')),
    card.DOM
      .map(set(superLens, {
        in: {className: 'slide-from-right'},
        out: {className: '', duration: 500},
      })),
  )
  .map(apply(set(keyLens)))

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
    DOM,
    route$,
    queue$,
  }
}

export const EngagementView = sources =>
  Fetch(Engagement)({
    ...sources,
    engagementKey$: sources.key$,
  })
