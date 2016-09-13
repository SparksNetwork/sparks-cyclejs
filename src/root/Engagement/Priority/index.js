import {Observable as $} from 'rx'
import {combineDOMsToDiv} from 'util'

import isolate from '@cycle/isolate'

import {CardUpcomingShifts} from './CardUpcomingShifts'
import {CardApplicationNextSteps} from './CardApplicationNextSteps'
import {CardEnergyExchange} from './CardEnergyExchange'
import {CardConfirmNow} from './CardConfirmNow'
import {CardPickMoreShifts} from './CardPickMoreShifts'
import {CardWhois} from './CardWhois'

export default sources => {
  const who = isolate(CardWhois)(sources)
  const confirm = isolate(CardConfirmNow)(sources)
  const app = isolate(CardApplicationNextSteps)(sources)
  const r2w = isolate(CardUpcomingShifts)(sources)
  const pms = isolate(CardPickMoreShifts)(sources)
  const ee = isolate(CardEnergyExchange)(sources)

  const DOM = combineDOMsToDiv('.cardcontainer',who,confirm,app,r2w,pms,ee)

  return {
    DOM,
    route$: $.merge(confirm.route$, app.route$),
    openAndPrint: r2w.openAndPrint,
  }
}
