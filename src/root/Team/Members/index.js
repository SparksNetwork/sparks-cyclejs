import {Observable} from 'rx'
const {of, combineLatest} = Observable
import {map, prop, compose, filter, complement, allPass} from 'ramda'

import {TabbedPage} from 'components/ui'

import EngagedList from 'components/EngagedList'

import {
  Engagements,
  Memberships,
} from 'components/remote'

const isConfirmedΩ = prop('isConfirmed')
const isDeclinedΩ = prop('isDeclined')
const isAcceptedΩ = prop('isAccepted')

const confirmedΩ = isConfirmedΩ
const neverΩ = allPass([
  complement(isAcceptedΩ),
  isDeclinedΩ,
  complement(isConfirmedΩ),
])
const okΩ = allPass([
  isAcceptedΩ,
  complement(isConfirmedΩ),
])
const appliedΩ = allPass([
  complement(okΩ),
  complement(neverΩ),
  complement(confirmedΩ),
])

const filterApplied = filter(appliedΩ)
const filterOK = filter(okΩ)
const filterNever = filter(neverΩ)
const filterConfirmed = filter(confirmedΩ)

const validMembershipΩ = membership =>
  membership.authorProfileKey === void 0 ||
    membership.profileKey === void 0

const Fetch = component => sources => {
  const all$ = sources.teamKey$
    .flatMapLatest(Memberships.query.byTeam(sources))
    .shareReplay(1)

  const e$ = all$
    .map(filter(validMembershipΩ)) // filter out naughty records
    .shareReplay(1)

  return component({
    ...sources,
    memberships$: e$,
    applied$: e$.map(filterApplied).shareReplay(1),
    ok$: e$.map(filterOK).shareReplay(1),
    never$: e$.map(filterNever).shareReplay(1),
    confirmed$: e$.map(filterConfirmed).shareReplay(1),
  })
}

const TabMaker = sources => ({
  tabs$: combineLatest(
    sources.applied$,
    sources.ok$,
    sources.never$,
    (ap,ok,nv) => [
      {path: '/', label: `${ap.length} Applied`},
      {path: '/ok', label: `${ok.length} Accepted`},
      {path: '/never', label: `${nv.length} Denied`},
    ].filter(Boolean)
  ),
})

const EngagementsFetcher = component => sources => {
  const query = Engagements.query.one(sources)
  const mquery = Memberships.query.byEngagement(sources)

  const raw$ = sources.memberships$
    .map(map(compose(query, prop('engagementKey'))))
    .flatMapLatest(m => combineLatest(...m))

  const bad$ = raw$
    .map(filter(e => !e.profileKey))
    .map(map(compose(mquery, prop('$key'))))
    .flatMapLatest(m => combineLatest(...m))

  bad$.subscribe(ms => console.warn('bad memberships', ms))

  const engagements$ = raw$
    .map(filter(e => e.profileKey))

  return component({...sources, engagements$})
}

const FetchedList = EngagementsFetcher(EngagedList)

const TeamMembers = sources => {
  const makeList = memberships$ =>
    sources => FetchedList({...sources, memberships$})

  return {
    pageTitle: of('Team Members'),

    ...TabbedPage({...sources,
      tabs$: TabMaker(sources).tabs$,
      routes$: of({
        '/': makeList(sources.applied$),
        '/ok': makeList(sources.ok$),
        '/confirmed': makeList(sources.confirmed$),
        '/never': makeList(sources.never$),
      }),
    }),
  }
}

export default Fetch(TeamMembers)
