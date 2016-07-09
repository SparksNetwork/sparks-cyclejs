import {Observable as $} from 'rx'

import {
  LargeCard,
  InputControl,
  RaisedButton,
} from 'components/sdm'

const InputNewDay = sources => InputControl({...sources,
    label$: $.of('Add shifts for (YYYY-MM-DD)'),
})

export const CardNewDay = sources => {
  const ic = InputNewDay(sources)
  const rb = RaisedButton({label$: $.of('Add Date'), ...sources})
  const card = LargeCard({...sources,
    content$: $.just([ic.DOM, rb.DOM]),
  })

  const route$ = ic.value$
    .sample(rb.click$)
    .combineLatest(
      sources.teamKey$,
      (date, team) => `/team/${team}/schedule/shifts` + (date ? `/${date}` : '')
    )

  return {
    DOM: card.DOM,
    route$,
  }
}

