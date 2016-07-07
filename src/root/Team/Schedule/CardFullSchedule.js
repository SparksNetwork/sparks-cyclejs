import {Observable as $} from 'rx'
require('./styles.scss')

import {
  LargeCard,
  TitledCard,
  InputControl,
  RaisedButton,
  List,
  ListItemCollapsibleDumb,
  ListItemClickable,
  ListItem,
  ListItemHeader,
} from 'components/sdm'

import isolate from '@cycle/isolate'

import {combineDOMsToDiv, localTime} from 'util'
import {ShiftContent} from 'components/shift'

const PrintItem = sources => ListItemClickable({...sources,
  title$: $.of('Print your current schedule on dead trees.'),
  iconName$: $.of('print'),
})

const ShiftItem = sources => {
  return ListItemCollapsibleDumb({...sources,
    ...ShiftContent(sources),
  })
}

const formatDayTitle = shift => localTime(shift.date).format('dddd, D MMMM')

const DayItem = sources => {
  const shifts$ = sources.shifts$

  const list = List({...sources,
    rows$: shifts$,
    Control$: $.of(ShiftItem),
  })
  return ListItemCollapsibleDumb({...sources,
    title$: sources.item$.map(formatDayTitle),
    isOpen$: $.of(true),
    contentDOM$: list.DOM,
  })
}

// function OldShiftItem(sources) {
//   const content = ShiftContent(sources)

//   const subtitle$ = $.combineLatest(content.subtitle$, sources.item$)
//     .map(buildSubtitle)

//   const assignments$ = sources.teamInfo$.pluck('assignments')
//     .withLatestFrom(sources.item$, (memberships, item) =>
//       filter(propEq('shiftKey', item.$key), memberships)
//     )

//   const profiles$ = assignments$.map(map(prop('profileKey')))
//     .map(filter(Boolean))
//     .map(map(Profiles.query.one(sources)))
//     .flatMapLatest($.combineLatest)
//     .shareReplay(1)

//   const contentDOM$ =
//     prop('DOM', List({...sources,
//       rows$: profiles$,
//       Control$: $.just(ProfileItem),
//     }))
//     .startWith(div({}, [null]))
//     .shareReplay(1)

//   const isOpen$ = contentDOM$.map(v => v.children[0] !== null)

//   const li = ListItemCollapsibleDumb({...sources, ...content,
//     subtitle$,
//     contentDOM$,
//     isOpen$,
//   })

//   return {...li}
// }

const PageHeader = sources => {
  const li = ListItem({...sources,
    title$: sources.team$.pluck('name'),
    classes$: $.of({header: true, printableHeader: true}),
  })
  return {
    DOM: combineDOMsToDiv('.printableHeader', li),
  }
}

const PageBody = sources => {
  const li = List({...sources,
    rows$: sources.shiftDates$,
    Control$: $.of(DayItem),
  })
  return {
    DOM: combineDOMsToDiv('.printableBody', li),
  }
}

const PrintableContent = sources => {
  const hdr = PageHeader(sources)
  const bod = PageBody(sources)

  return {
    DOM: combineDOMsToDiv('.printable',hdr,bod),
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
    .map(e => e[0].innerHTML)

  return {
    DOM: card.DOM,
    openAndPrint: printable$.sample(print.click$),
  }
}

