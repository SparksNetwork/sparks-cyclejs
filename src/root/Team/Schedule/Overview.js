import {combineDOMsToDiv, mergeSinks} from 'util'

import {CardNewDay} from './CardNewDay'
import {CardFullSchedule} from './CardFullSchedule'
import {CardMetrics} from './CardMetrics'

export default (sources) => {
  const metrics = CardMetrics(sources)
  const newDay = CardNewDay(sources)
  const fullSchedule = CardFullSchedule(sources)

  return {
    DOM: combineDOMsToDiv('.cardcontainer', metrics, newDay, fullSchedule),
    ...mergeSinks(newDay, fullSchedule),
  }
}
