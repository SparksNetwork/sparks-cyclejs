import {Observable as $} from 'rx'
const {of, combineLatest} = $
import {
  prop, filter, propEq, whereEq, map,
} from 'ramda'
import moment from 'moment'

import {
  AssignmentsFetcher,
} from 'components/assignment'

import {
  Shifts,
  Commitments,
  Profiles,
} from 'components/remote'

const volShifts = filter(whereEq({code: 'shifts', party: 'vol'}))

export const ProfilesFetcher = component => sources => {
  const query = Profiles.query.one(sources)

  const profiles$ = sources.engagements$.map(
    map(engagement =>
      query(engagement.profileKey)
        .map(profile => ({...engagement, profile}))
    )
  )
  .flatMapLatest(engagements => combineLatest(...engagements))

  return component({...sources, profiles$})
}

export const EngagementFetcher = component => sources => {
  const profileKey$ = sources.item$.map(prop('profileKey'))
  const profile$ = sources.item$.map(prop('profile'))
  const oppKey$ = sources.item$.map(prop('oppKey'))

  const assignments$ = oppKey$.flatMapLatest(oppKey =>
    AssignmentsFetcher({...sources, profileKey$})
      .assignments$
      .map(filter(propEq('oppKey', oppKey)))
  )

  const commitments$ =
    oppKey$.flatMapLatest(
      Commitments.query.byOpp(sources)
    )
    .map(volShifts)
    .shareReplay(1)

  const shifts$ = assignments$
    .map(arr => arr.map(a => Shifts.query.one(sources)(a.shiftKey)))
    .shareReplay(1)
    .flatMapLatest(oarr => oarr.length > 0 ?
      $.combineLatest(...oarr) :
      of([])
    )
    .map(arr => arr.sort((a,b) => moment(a.start) - moment(b.start)))
    .shareReplay(1)

  return component({
    ...sources,
    profileKey$,
    profile$,
    oppKey$,
    shifts$,
    assignments$,
    commitments$,
  })
}

