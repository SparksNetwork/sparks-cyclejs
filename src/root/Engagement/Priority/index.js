import {Observable} from 'rx'
const {merge} = Observable

import {combineDOMsToDiv} from 'util'
import {complement, not, prop, propEq, allPass} from 'ramda'

import isolate from '@cycle/isolate'
import {hideable} from 'util'

import {CardUpcomingShifts} from './CardUpcomingShifts'
import {CardEnergyExchange} from './CardEnergyExchange'
import {CardConfirmNow} from './CardConfirmNow'
import {CardPickMoreShifts} from './CardPickMoreShifts'

import CardProjectInfo from './CardProjectInfo'
import CardAdmin from './CardAdmin'
import CardApplying from './CardApplying'
import CardApplied from './CardApplied'

const isApplying = propEq('isApplied', false)
// const isApplied = prop('isApplied')
const isApplied = allPass([prop('isApplied'), complement(prop('isAccepted'))])
const isConfirmed = prop('isConfirmed')

export default sources => {
  const info = CardProjectInfo(sources)
  const admin = hideable(CardAdmin)({...sources,
    isVisible$: sources.userProfile$.pluck('isAdmin'),
  })
  const applying = hideable(CardApplying)({...sources,
    isVisible$: sources.engagement$.map(isApplying),
  })
  const applied = hideable(CardApplied)({...sources,
    isVisible$: sources.engagement$.map(isApplied),
  })
  const confirm = isolate(CardConfirmNow)(sources)
  const r2w = isolate(CardUpcomingShifts)(sources)
  const pms = isolate(CardPickMoreShifts)(sources)
  const ee = isolate(CardEnergyExchange)(sources)

  const DOM = combineDOMsToDiv('.cardcontainer',info,admin,applying,applied,confirm,r2w,pms,ee)

  return {
    DOM,
    route$: merge(applying.route$, confirm.route$),
    // route$: $.merge(applying.route$),
    // openAndPrint: r2w.openAndPrint,
  }
}
