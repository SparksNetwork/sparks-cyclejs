import {Observable as $} from 'rx'
import {
  always, ifElse, prop,
} from 'ramda'
import {row, cell, icon} from 'helpers/layout'

import {
  Avatar,
} from 'components/sdm'

import {
  TeamFetcher,
} from 'components/team'

import {localTime} from 'util'

const icons = [0,1,2,3,4,5,6]
  .map(i => '/' + require(`images/daytimeicon_${i}.png`))

const daySegment = hr => Math.floor((parseInt(hr) + 2) / 4)

const srcFromTime = time => icons[daySegment(localTime(time).hours())]

export const TimeOfDayAvatar = sources => Avatar({...sources,
  src$: sources.time$.map(srcFromTime),
})

export const timeCell = t =>
  cell({minWidth: '100px', textAlign: 'left'}, localTime(t).format('h:mm a'))

export const ShiftContent = sources => {
  const tod = TimeOfDayAvatar({...sources,
    time$: sources.item$.pluck('start'),
  })

  return {
    leftDOM$: tod.DOM,
    title$: $.combineLatest(
      sources.item$.pluck('start'),
      sources.item$.pluck('end'),
      sources.item$.pluck('people'),
      sources.item$.pluck('assigned'),
      (s,e,p,a) => row({},
        timeCell(s), timeCell(e),
        cell({flex: '100', textAlign: 'right'},
          `${a||0} / ${p} `,icon('people')
        ),
      )
    ),
    subtitle$: sources.item$.pluck('hours').map(h => `${h} hours`),
  }
}

export const ShiftContentExtra = sources => {
  const {team$} = TeamFetcher({...sources,
    teamKey$: sources.item$.pluck('teamKey'),
  })

  const tod = TimeOfDayAvatar({...sources,
    time$: sources.item$.pluck('start'),
  })

  return {
    leftDOM$: tod.DOM,
    title$: $.combineLatest(
      sources.item$.pluck('start'),
      team$.map(
        ifElse(Boolean,
          prop('name'),
          always('Orphaned shift!')
        )
      ),
      sources.item$.pluck('people'),
      sources.item$.pluck('assigned'),
      (s,n,p,a) => row({},
        cell({minWidth: '100px'},localTime(s).format('ddd D MMM')),
        cell({flex: '100'},n),
        cell({minWidth: '100px', textAlign: 'right'},
          `${a||0} / ${p} `,icon('people')
        ),
      )
    ),
    subtitle$: $.combineLatest(
      sources.item$.pluck('start'),
      sources.item$.pluck('end'),
      sources.item$.pluck('hours'),
      (s,e,h) => row({},
        timeCell(s), timeCell(e),
        cell({flex: '100'},`${h} hours`),
      )
    ),
  }
}
