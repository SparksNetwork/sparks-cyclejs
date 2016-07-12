import {combineDOMsToDiv, mergeSinks} from 'util'

import {CardNewDay} from './CardNewDay'
import {CardFullSchedule} from './CardFullSchedule'

export default (sources) => {
  const newDay = CardNewDay(sources)
  const fullSchedule = CardFullSchedule(sources)

  return {
    DOM: combineDOMsToDiv('.cardcontainer', newDay, fullSchedule),
    ...mergeSinks(newDay, fullSchedule),
    // route$: newDay.route$,
    // openAndPrint: fullSchedule.openAndPrint,
  }
}
