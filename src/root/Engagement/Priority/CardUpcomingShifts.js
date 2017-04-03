import {Observable as $} from 'rx'
import {hideable} from 'util'
import {div, a} from 'cycle-snabbdom'
import isolate from '@cycle/isolate'
import {Printable} from 'components/Printable'

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
  title$: $.of('Print your schedule on dead trees.'),
  iconName$: $.of('print'),
})

const COL_A = [
  'a magnificent',
  'a beautiful',
  'a giving',
  'an amazing',
  'an incredible',
  'a phenomenal',
  'a passionate',
  'a powerful',
  'an epic',
  'a grand',
  'a lovely',
  'an excellent',
  'a superb',
  'a marvelous',
  'a glorious',
  'a courageous',
  'a tremendous',
  'a noble',
]
const COL_B = [
  'creator of things',
  'human being',
  'soul',
  'beauty-creator',
  'maker of joy',
  'builder of a better world',
  'pillar of humanity',
  'maker of magic',
  'person',
  'forge of the future',
  'generator of joy',
  'producer of positivity',
  'composer of consciousness',
  'mover',
  'weaver of the world',
  'enabler of the extraordinary',
]

const pick = arr => arr[Math.floor(Math.random() * arr.length)]

const chineseMenu = () =>
  pick(COL_A) + ' ' + pick(COL_B)

const PrintableScheduleHeader = sources => {
  return {
    DOM: sources.profile$.map(
      (profile) => div({}, [
        div('.volunteer', [
          profile.fullName,
        ]),
        div('.inspiration', [
          chineseMenu(),
        ]),
        div('.instructions', [
          `Are you ready to make a difference? ` +
          `You are needed for these shifts:`,
        ]),
      ])
    ),
  }
}

const PrintableScheduleFooter = sources => {
  return {
    DOM: sources.project$.map(project =>
      div('.note', [
        `Thank you from ${project.name} and the Sparks.Network!`,
      ])
    ),
  }
}

const printableView = (phdr, plist, pftr) => div({}, [phdr, plist, pftr])

export const PersonalPrintableSchedule = sources => {
  const list = _List(sources)
  const phdr = PrintableScheduleHeader(sources)
  const pftr = PrintableScheduleFooter(sources)
  return Printable({...sources,
    contentDOM$: $.combineLatest(phdr.DOM, list.DOM, pftr.DOM, printableView),
  })
}

export const CardUpcomingShifts = sources => {
  const profile$ = sources.engagement$.pluck('profileKey')
    .flatMapLatest(Profiles.query.one(sources))

  const info = _Info(sources)
  const list = _List(sources)
  const plist = PersonalPrintableSchedule({...sources, profile$})

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
    .map(e => e[0])

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

