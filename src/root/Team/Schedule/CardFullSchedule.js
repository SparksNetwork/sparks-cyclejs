import {Observable as $} from 'rx'
import './styles.scss'
import R from 'ramda'

import {
  LargeCard,
  List,
  ListItemClickable,
} from 'components/sdm'

import isolate from '@cycle/isolate'
import {div, img, a} from 'cycle-snabbdom'

import {combineDOMsToDiv, localTime} from 'util'

import {Profiles, Assignments, Arrivals, Engagements} from 'components/remote'

import {TimeOfDayAvatar} from 'components/shift'

const PrintItem = sources => ListItemClickable({...sources,
  title$: $.of('Print your current schedule on dead trees.'),
  iconName$: $.of('print'),
})

const statusDiv = (engagement, arrivals) => {
  if (!engagement.isConfirmed) {
    return div('.status.unconfirmed', ['NEEDS TO CONFIRM'])
  }
  if (arrivals.length > 0) {
    return div('.status.arrived', ['ONSITE'])
  }
}

const assignmentItemView = (profile, arrivals, engagement) =>
  div('.assignment', [
    img({class: {avatar: true}, attrs: {src: profile.portraitUrl}}),
    div('.name', [profile.fullName]),
    div('.phone', [profile.phone]),
    a({
      class: {phone: true},
      attrs: {href: 'mailto:' + profile.email},
    }, [
      profile.email,
    ]),
    statusDiv(engagement, arrivals),
  ])

const AssignmentItem = sources => {
  const profile$ = sources.item$.pluck('profileKey')
    .flatMapLatest(Profiles.query.one(sources))

  const arrivals$ = $.combineLatest(
    sources.projectKey$,
    sources.item$.pluck('profileKey'),
    (projectKey, profileKey) => `${projectKey}-${profileKey}`
  ).flatMapLatest(Arrivals.query.byProjectProfile(sources))

  const engagement$ = sources.item$.pluck('engagementKey')
    .flatMapLatest(Engagements.query.one(sources))

  return {
    DOM: $.combineLatest(profile$, arrivals$, engagement$, assignmentItemView),
  }
}

const humanDate = date => localTime(date).format('dddd, D MMMM')

import {cell} from 'helpers/layout'
export const timeCell = t =>
  cell({minWidth: '150px', textAlign: 'left'}, localTime(t).format('h:mm a'))

const shiftHeaderView = (shift, day, team, todDOM) =>
  div('.shift-header', [
    div('.top', [
      div('.date', [humanDate(day)]),
      div('.team', [team.name]),
    ]),
    div('.bottom', [
      todDOM,
      timeCell(shift.start),
      timeCell(shift.end),
      div('.duration', [`${shift.hours || 0} hrs`]),
      div({
        class: {
          headcount: true,
          warning: (shift.assigned || 0) < shift.people,
        },
      }, [
        `${shift.assigned || 0}/${shift.people}`,
      ]),
    ]),
  ])

const ShiftHeader = sources => {
  const tod = TimeOfDayAvatar({...sources,
    time$: sources.item$.pluck('start'),
  })

  return {
    DOM: $.combineLatest(
      sources.item$, sources.day$, sources.team$, tod.DOM,
      shiftHeaderView,
    ),
  }
}

const ShiftBlock = sources => {
  const assignments$ = sources.item$.pluck('$key')
    .flatMapLatest(Assignments.query.byShift(sources))

  const hdr = ShiftHeader(sources)

  const list = List({...sources,
    rows$: assignments$,
    Control$: $.of(AssignmentItem),
  })

  return {
    DOM: combineDOMsToDiv('.shift', hdr, list),
  }
}

const shortDate = date =>
  localTime(date).format('YYYY-MM-DD')

const localTimeStartSort = (a,b) =>
  localTime(a.start) > localTime(b.start) ? 1 : -1

const DayBlock = sources => {
  const list = List({...sources,
    day$: sources.item$,
    rows$: $.combineLatest(
        sources.item$, sources.shifts$,
        (day, shifts) => shifts.filter(s => shortDate(s.start) === day)
      )
      .map(shifts => shifts.sort(localTimeStartSort)),
    Control$: $.of(ShiftBlock),
  })

  return {
    DOM: combineDOMsToDiv('.day', list),
  }
}

const PrintableContent = sources => {
  const days = List({...sources,
    rows$: sources.shiftDates$
      .map(R.uniq)
      .map(d => d.sort()),
    Control$: $.of(DayBlock),
  })
  const frame = {
    DOM: combineDOMsToDiv('.printablePage',days),
  }

  return {
    DOM: combineDOMsToDiv('.printable',frame),
  }
}

export const CardFullSchedule = sources => {
  const print = isolate(PrintItem)(sources)
  const fullSched = PrintableContent(sources)
  const card = LargeCard({...sources,
    content$: $.of([print.DOM, fullSched.DOM]),
  })

  const printable$ = sources.DOM.select('.printable')
    .observable
    .filter(e => e.length === 1)
    .map(e => e[0])

  return {
    DOM: card.DOM,
    openAndPrint: printable$.sample(print.click$),
  }
}
