import {Observable as $} from 'rx'

import {div} from 'cycle-snabbdom'

import {
  LargeCard,
  ListItem,
} from 'components/sdm'

const percentView = percent =>
  div({
    class: {accent: percent < 100},
    style: {fontSize: '28px', fontWeight: 'bold'},
  }, [
    `${percent}%`,
  ])

const ShiftCountListItem = sources => ListItem({...sources,
  leftDOM$: sources.assignedPercent$.map(percentView),
  // leftDOM$: $.combineLatest(sources.assigned$, sources.people$, percent),
  title$: $.combineLatest(sources.assigned$, sources.people$, (a,p) =>
    `${a}/${p} Filled Shifts`
  ),
  subtitle$: $.just('some may not be confirmed'),
})

const avgHours = h =>
  div({
    style: {fontSize: '28px', fontWeight: 'bold'},
  }, h)

const AverageHoursListItem = sources => ListItem({...sources,
  leftDOM$: sources.averageHoursPerShift$
    .map(avgHours),
  title$: $.just('Average Hours'),
  subtitle$: $.just('per shift assignment'),
})

export const CardMetrics = sources => {
  const counts = ShiftCountListItem(sources)
  const avghours = AverageHoursListItem(sources)
  const card = LargeCard({...sources,
    content$: $.just([
      counts.DOM,
      avghours.DOM,
    ]),
  })

  return {
    DOM: card.DOM,
  }
}

