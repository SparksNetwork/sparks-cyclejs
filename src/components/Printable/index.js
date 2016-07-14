import './styles.scss'

import {combineDOMsToDiv} from 'util'

export const Printable = sources => {
  // const days = List({...sources,
  //   rows$: sources.shiftDates$
  //     .map(R.uniq)
  //     .map(d => d.sort()),
  //   Control$: $.of(DayBlock),
  // })
  const frame = {
    DOM: combineDOMsToDiv('.printablePage',{DOM: sources.contentDOM$}),
  }

  return {
    DOM: combineDOMsToDiv('.hidden.printable',frame),
  }
}
