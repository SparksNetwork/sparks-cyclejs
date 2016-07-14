import {Observable as $} from 'rx'
import {hideable} from 'util'
import {div, a} from 'cycle-snabbdom'
import isolate from '@cycle/isolate'
import {combineDOMsToDiv} from 'util'

import {
  List,
  ListItem,
  TitledCard,
  ListItemClickable,
} from 'components/sdm'

import {
  ShiftContentExtra,
} from 'components/shift'

import {
  DescriptionListItem,
} from 'components/ui'

import {
  Profiles,
} from 'components/remote'

const _Info = sources => ListItem({...sources,
  title$: sources.shifts$
    .map(shifts => `
      You've got ${shifts.length} shifts coming up.
      Are you ready to make a difference?
    `),
})

const _Reschedule = sources => DescriptionListItem({...sources,
  title$: $.of(
    div('', [
      'Your schedule is locked.  To request an unlock, email ',
      a({attrs: {href: 'mailto:help@sparks.network'}},'help@sparks.network'),
      '.',
    ])
  ),
})

const _Item = sources => ListItem({...sources,
  ...ShiftContentExtra(sources),
})

const _List = sources => List({...sources,
  Control$: $.of(_Item),
  rows$: sources.shifts$,
})

const _PrintSchedule = sources => ListItemClickable({...sources,
  title$: $.of('Print your current schedule on dead trees.'),
  iconName$: $.of('print'),
})

const PrintableScheduleHeader = sources => {
  const profile$ = sources.engagement$.pluck('profileKey')
    .flatMapLatest(Profiles.query.one(sources))

  return {
    DOM: profile$.map(
      (profile) => div('.volunteer', [profile.fullName])
    ),
  }
}

// const shiftHeaderView = (shift, day, team, todDOM) =>
//   div('.shift-header', [
//     div('.top', [
//       div('.date', [humanDate(day)]),
//       div('.team', [team.name]),
//     ]),
//     div('.bottom', [
//       todDOM,
//       timeCell(shift.start),
//       timeCell(shift.end),
//       div('.duration', [`${shift.hours || 0} hrs`]),
//       div({
//         class: {
//           headcount: true,
//           warning: (shift.assigned || 0) < shift.people,
//         },
//       }, [
//         `${shift.assigned || 0}/${shift.people}`,
//       ]),
//     ]),
//   ])

const PrintableContent = sources => {
  const hdr = PrintableScheduleHeader(sources)
  const list = _List(sources)
  const frame = {
    DOM: combineDOMsToDiv('.printablePage',hdr, list),
  }

  return {
    DOM: combineDOMsToDiv('.hidden.printable',frame),
  }
}

export const CardUpcomingShifts = sources => {
  const info = _Info(sources)
  // const list = PrintableContent(sources)
  // const list = hideable(PrintableContent)({...sources,
  //   isVisible$: $.of(false),
  // })
  const plist = PrintableContent(sources)
  const list = _List(sources)
  const rs = _Reschedule(sources)
  const pr = isolate(_PrintSchedule)(sources)

  const isVisible$ = $.combineLatest(
    sources.engagement$,
    sources.commitmentShifts$,
    sources.shifts$,
    ({isAssigned, isPaid, isConfirmed}, shiftsReq, shifts) =>
      isAssigned && isPaid && isConfirmed && shifts.length === shiftsReq
  )

  const printable$ = sources.DOM.select('.printable')
    .observable
    .filter(e => e.length === 1)
    .map(e => e[0].innerHTML)

  const content$ = $.of([
    info.DOM,
    pr.DOM,
    list.DOM,
    rs.DOM,
    plist.DOM,
  ])

  const comp = hideable(TitledCard)({...sources,
    title$: $.just('Ready to Work?'),
    content$,
    isVisible$,
  })

  return {
    ...comp,
    openAndPrint: pr.click$.withLatestFrom(printable$, (cl,pr) => pr),
  }
}

