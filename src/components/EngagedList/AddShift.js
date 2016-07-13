import {Observable as $} from 'rx'
const {of, combineLatest} = $
import {
  assoc, compose, contains, curryN, filter, flatten, groupBy, head, last, map,
  prop, propEq, sortBy, toPairs, uniqBy, nth, ifElse, applySpec, find,
} from 'ramda'
import {
  Shifts,
  Assignments,
} from 'components/remote'
import {Collapsible} from 'components/behaviors'
import {
  List,
  ListItem,
  ListItemCheckbox,
} from 'components/sdm'
import {TeamIcon} from 'components/team/TeamIcon'
import {localTime, formatDate} from 'util'
import {ShiftContentExtra} from 'components/shift'

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
  const item = ListItemCheckbox({
    ...sources,
    ...ShiftContentExtra(sources),
    classes$: of({'col-sm-offset-1': true}),
    value$: sources.item$
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
  .flatMapLatest(({assignment, ...values}) =>
    item.value$.map(
      ifElse(Boolean,
        () => Assignments.action.create({values}),
        () => Assignments.action.remove({key: assignment.$key})
      )
    )
  )

  return {
    DOM: item.DOM,
    queue$,
  }
}

const TeamItem = sources => {
  const shiftList = List({
    ...sources,
    rows$: sources.item$
      .map(prop('shifts'))
      .map(sortShifts),
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
    classes$: of({'col-sm-offset-1': true}),
  }).DOM

  return {
    ...shiftList,
    DOM,
  }
}

const DayItem = sources => {
  const teamList = List({
    ...sources,
    rows$: sources.item$
      .map(last)
      .flatMapLatest(shifts => sources.teams$.map(teamsAndShifts(shifts))),
    Control$: of(TeamItem),
  })

  const DOM = Collapsible(ListItem)({
    ...sources,
    title$: sources.item$.map(head),
    contentDOM$: teamList.DOM,
    iconName$: of('calendar2'),
    classes$: of({'col-sm-offset-1': true}),
  }).DOM

  return {
    ...teamList,
    DOM,
  }
}

const AddShift = sources => {
  const dayList = List({
    ...sources,
    rows$: sources.shifts$
      .take(1)
      .map(groupBy(compose(formatDate, prop('date'))))
      .map(toPairs),
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
