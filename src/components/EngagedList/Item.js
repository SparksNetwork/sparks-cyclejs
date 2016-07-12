import {Observable as $} from 'rx'
const {of, combineLatest} = $
import {
  compose, equals, filter, map, objOf, prop, reject, sum, whereEq,
} from 'ramda'

import moment from 'moment'

import {
  ListItemNavigating,
} from 'components/sdm'

import {
  ProfileFetcher,
} from 'components/profile'

import {
  Shifts,
  Commitments,
} from 'components/remote'

import {AssignmentsFetcher} from 'components/assignment'

import {cellC, icon} from 'helpers/layout'

import {log} from 'util'

const volShifts = filter(whereEq({code: 'shifts', party: 'vol'}))

const Fetch = component => sources => {
  const profileKey$ = sources.item$.map(prop('profileKey'))
  const {profile$} = ProfileFetcher({...sources, profileKey$})
  const assignments$ =
    AssignmentsFetcher({...sources, profileKey$}).assignments$
  const commitments$ =
    sources.oppKey$.flatMapLatest(
      Commitments.query.byOpp(sources)
    )
    .map(volShifts)
    .shareReplay(1)

  const shifts$ = assignments$
    .map(arr => arr.map(a => Shifts.query.one(sources)(a.shiftKey)))
    .tap(log('shifts$ passed to query'))
    .shareReplay(1)
    .flatMapLatest(oarr => oarr.length > 0 ?
      $.combineLatest(...oarr) :
      of([])
    )
    .tap(log('shifts$ from assignments$'))
    .map(arr => arr.sort((a,b) => moment(a.start) - moment(b.start)))
    .shareReplay(1)

  return component({
    ...sources,
    profileKey$,
    profile$,
    shifts$,
    assignments$,
    commitments$,
  })
}

const EngagementAssignmentCount = sources => ({
  DOM: combineLatest(
    sources.shifts$.map(prop('length')),
    sources.commitments$.map(
      compose(
        sum,
        reject(isNaN),
        map(Number),
        map(prop('count'))
      )
    )
  )
  .map(([shifts, commitments]) =>
    cellC(
      {accent: shifts !== commitments},
      `${shifts}/${commitments}`,
      icon('insert_invitation')
    )
  ),
})

const Item = sources => {
  const eac = EngagementAssignmentCount(sources)

  const li = ListItemNavigating({...sources,
    title$: sources.profile$.map(prop('fullName')),
    iconSrc$: sources.profile$.map(prop('portraitUrl')),
    rightDOM$: eac.DOM,
    path$: sources.item$.map(({$key}) =>
      sources.createHref(`/show/${$key}`)),
    classes$: $.combineLatest(
      sources.item$.map(prop('$key')),
      sources.key$ || of(false),
      equals
    )
    .map(objOf('yellow')),
  })

  return li
}

export default Fetch(Item)
