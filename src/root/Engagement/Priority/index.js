import {Observable} from 'rx'
const {merge} = Observable

import {combineDOMsToDiv} from 'util'
import {propEq} from 'ramda'

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

export default sources => {
  const info = CardProjectInfo(sources)

  const admin = hideable(CardAdmin)({...sources,
    isVisible$: sources.userProfile$.pluck('isAdmin'),
  })

  const applying = hideable(CardApplying)({...sources,
    isVisible$: sources.engagement$.map(isApplying),
  })

  const applied = hideable(CardApplied)({...sources,
    isVisible$: sources.engagement$.combineLatest(sources.opp$,
      (engagement, opp) => {
        if (opp.confirmationsOn && engagement.isAccepted) {
          return false
        }

        if (!opp.confirmationsOn && engagement.isAccepted) {
          return true
        }

        if (engagement.isApplied) {
          return true
        }

        return false
      }
    ),
  })

  const confirm = hideable(isolate(CardConfirmNow))({...sources,
    isVisible$: sources.opp$.map(o => !!o.confirmationsOn),
  })

  const r2w = isolate(CardUpcomingShifts)(sources)
  const pms = isolate(CardPickMoreShifts)(sources)
  const ee = isolate(CardEnergyExchange)(sources)

  const DOM = combineDOMsToDiv('.cardcontainer',
    info,admin,applying,applied,confirm,r2w,pms,ee)

  return {
    DOM,
    route$: merge(applying.route$, confirm.route$),
    openAndPrint: r2w.openAndPrint,
  }
}
