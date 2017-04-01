import { Observable as $ } from "rx"
import {
  any, applySpec, assoc, compose, contains, curryN, filter, find, flatten, groupBy, head, ifElse,
  last, map, nth, prop, propEq, sortBy, toPairs, uniqBy
} from "ramda"
import { Assignments, Shifts } from "components/remote"
import { Collapsible } from "components/behaviors"
import { List, ListItem, ListItemCheckbox } from "components/sdm"
import { TeamIcon } from "components/team/TeamIcon"
import { formatDate, localTime } from "util"
import { ShiftContentExtra } from "components/shift"
import { traceSinks, traceSource } from "../../trace"
import { isShiftOverlappingWithAssignments } from "../../util"
const { of, combineLatest } = $

const sortShifts = sortBy(compose(localTime, prop('start')))

const assocMatchingShifts = curryN(2, (shifts, team) =>
  assoc('shifts',
    filter(propEq('teamKey', team.$key), shifts),
    team
  )
)

const teamHasOneOfShifts = curryN(2, (shifts, team) =>
  contains(team.$key, map(prop('teamKey'))(shifts))
)

const teamsAndShifts = shifts =>
  compose(
    map(assocMatchingShifts(shifts)),
    filter(teamHasOneOfShifts(shifts))
  )

const Fetch = component => sources => {
  const shifts$ = sources.teams$
    .map(map(prop('$key')))
    .flatMapLatest(
      compose(
        combineLatest,
        map(Shifts.query.byTeam(sources)),
      )
    )
    .map(flatten)
    .map(uniqBy(prop('$key')))
    .map(sortBy(
      compose(
        localTime,
        prop('start'),
      )
    ))

  return component({
    ...sources,
    shifts$,
  })
}

const ShiftItem = sources => {
  // Assignments is an array of assigned shifts for a given opportunity/engagement/team
  /*
   {
   "$key": "-KKKQ4Z9a9z_kU9xxtQD",
   "endTime": "2016-07-13T17:56:06Z",
   "engagementKey": "-KGTaDXmEaMiZ9B0Xkmf",
   "oppKey": "-KEMfQuSuMoabBEy9Sdb",
   "profileKey": "-KGTaC_JGJSdekJs4fxK",
   "shiftKey": "-KJVw_QHEhftzplqBZtR",
   "startTime": "2016-07-13T10:47:21Z",
   "teamKey": "-KEMcgCK2a027JIscSfe"
   }
   */
  // item is ONE object with the shape
  /*
   {
   "$key": "-KLTNlfG9Z4C__kWGMRE",
   "assigned": 0,
   "date": "2016-07-11T00:00:00-07:00",
   "end": "2016-07-11T13:00:00Z",
   "hours": "6",
   "ownerProfileKey": "-KEMm75H0vdiV9v6WhyW",
   "people": "1",
   "reserved": 0,
   "start": "2016-07-11T07:00:00Z",
   "teamKey": "-KEMakFXQAxZe_pEi9by"
   }
   */

  const listItemCheckboxClasses = sources => of({ 'col-sm-offset-1': true })
    .withLatestFrom(sources.item$, sources.assignments$, function (classes, item, assignments) {
      debugger
      const isDisabled = isShiftOverlappingWithAssignments(item, assignments)
      console.warn('listItemCheckboxClasses$', isDisabled)

      return isDisabled
        ? assoc('disabled', true, classes)
        : classes
    })
    .shareReplay(1)

  const item = ListItemCheckbox({
    ...sources,
    ...ShiftContentExtra(sources),
    classes$: listItemCheckboxClasses(sources),
    // will be true if user is assigned to that shift
    value$: traceSource(`AddShifts > ListItemCheckbox > item$`, sources.item$)
      .map(prop('$key'))
      .flatMapLatest(shiftKey =>
          sources.assignments$
            .map(map(prop('shiftKey')))
            .map(contains(shiftKey))
      ),
  })

  const queue$ = combineLatest(
    sources.item$.map(prop('$key')),
    sources.item$.map(prop('teamKey')),
    sources.oppKey$,
    sources.engagementKey$,
    sources.engagement$.map(prop('profileKey')),
    sources.item$.map(prop('$key'))
      .flatMapLatest(shiftKey =>
        sources.assignments$.map(find(propEq('shiftKey', shiftKey)))
      )
  )
    .map(applySpec({
      shiftKey: nth(0),
      teamKey: nth(1),
      oppKey: nth(2),
      engagementKey: nth(3),
      profileKey: nth(4),
      assignment: nth(5),
    }))
    .flatMapLatest(({ assignment, ...values }) =>
      item.value$.map(
        ifElse(Boolean,
          () => Assignments.action.create({ values }),
          () => Assignments.action.remove({ key: assignment.$key })
        )
      )
    )

  return {
    DOM: item.DOM,
    queue$,
  }
}

const TeamItem = sources => {
  // TeamItem contains the list of `teamKey` relevant to the opportunity
  // TeamItem is an array of
  /*
   {
   "$key": "-Ka30v1Ei9HLopacK4C7",
   "date": "2017-04-10T00:00:00-07:00",
   "end": "2017-04-10T21:00:00-07:00",
   "hours": "12",
   "ownerProfileKey": "-KJIH87fkQTrgiOF0trX",
   "people": "12",
   "reserved": 0,
   "start": "2017-04-10T09:00:00-07:00",
   "teamKey": "-KXA78F7tz5ySe-S9KSr"
   }
   */
  const rows$ = traceSinks(`AddShift > TeamItem`, {
    rows$: sources.item$
      .map(prop('shifts'))
      .map(sortShifts)
  })

  const shiftList = List({
    ...sources,
    ...rows$,
    Control$: of(ShiftItem),
  })

  const DOM = Collapsible(ListItem)({
    ...sources,
    title$: sources.item$.map(prop('name')),
    leftDOM$: TeamIcon({
      ...sources,
      teamKey$: sources.item$.map(prop('$key')),
    }).DOM,
    contentDOM$: shiftList.DOM,
    classes$: of({ 'col-sm-offset-1': true }),
  }).DOM

  return {
    ...shiftList,
    DOM,
  }
}

const DayItem = sources => {
  // DayItem is a list of projects with the shifts associated??
  // DayItem rows is an array of
  /*
   {
   "$key": "-Ka3Ac3p4xScE8Lbc0OS",
   "description": "Build and or strike the most amazing camp kitchen ever!",
   "name": "Kitchen Build & Strike Crew",
   "ownerProfileKey": "-KJIH87fkQTrgiOF0trX",
   "projectKey": "-KX98Dpv7-qPiARjo3jv",
   "question": "Can you take direction and move heavy things?  Do you like the hustle and be helpful?",
   "shifts": [{
   "$key": "-Ka3B5JcvFYt2PctV7Ps",
   "date": "2017-03-30T00:00:00-07:00",
   "end": "2017-03-30T21:00:00-07:00",
   "hours": "12",
   "ownerProfileKey": "-KJIH87fkQTrgiOF0trX",
   "people": "4",
   "reserved": 0,
   "start": "2017-03-30T09:00:00-07:00",
   "teamKey": "-Ka3Ac3p4xScE8Lbc0OS"
   }]
   }
   */
  const rows$ = traceSinks(`AddShift > DayItem`, {
    rows$: sources.item$
      .map(last)
      .flatMapLatest(shifts => sources.teams$.map(teamsAndShifts(shifts)))
  })

  const teamList = List({
    ...sources,
    ...rows$,
    Control$: of(TeamItem),
  })

  const DOM = Collapsible(ListItem)({
    ...sources,
    title$: sources.item$.map(head),
    contentDOM$: teamList.DOM,
    iconName$: of('calendar2'),
    classes$: of({ 'col-sm-offset-1': true }),
  }).DOM

  return {
    ...teamList,
    DOM,
  }
}

const AddShift = sources => {
  // rows$ is an array of [date, [shifts]] (shifts are grouped by date)
  /*
   ["Thu 3rd Apr", [{
   "$key": "-Ka30PuUryvI979hrlQw",
   "date": "2014-04-03T00:00:00-07:00",
   "end": "2014-04-03T21:00:00-07:00",
   "hours": "12",
   "ownerProfileKey": "-KJIH87fkQTrgiOF0trX",
   "people": "12",
   "reserved": 0,
   "start": "2014-04-03T09:00:00-07:00",
   "teamKey": "-KXA78F7tz5ySe-S9KSr"
   }]]
   */
  // shifts is an array of, i.e. shifts + "$key": "-KLTNlfG9Z4C__kWGMRE" which is??
  // I suppose this is all the shifts for that opportunity???? Yes and all the teams??? Yes
  // what the fuck is ownerProfileKey then??
  /*
   {
   "$key": "-KLTNlfG9Z4C__kWGMRE",
   "assigned": 0,
   "date": "2016-07-11T00:00:00-07:00",
   "end": "2016-07-11T13:00:00Z",
   "hours": "6",
   "ownerProfileKey": "-KEMm75H0vdiV9v6WhyW",
   "people": "1",
   "reserved": 0,
   "start": "2016-07-11T07:00:00Z",
   "teamKey": "-KEMakFXQAxZe_pEi9by"
   }
   */
  const shifts$ = traceSource(`AddShift > shifts`, sources.shifts$)

  const rows$ = traceSinks(`AddShift >`, {
    rows$: shifts$
      .take(1)
      .map(groupBy(compose(formatDate, prop('date'))))
      .map(toPairs)
  })

  // dayList only returns a DOM sink with a list of rows whose behaviour is controlled by `DayItem`
  const dayList = List({
    ...sources,
    ...rows$,
    Control$: of(DayItem),
  })

  const addButton = Collapsible(ListItem)({
    ...sources,
    title$: of('Add shift'),
    iconName$: of('plus-square'),
    contentDOM$: dayList.DOM,
  })

  const DOM = addButton.DOM

  return {
    ...dayList,
    isOpen$: addButton.isOpen$,
    DOM,
  }
}

export default Fetch(AddShift)
