import {Observable as $} from 'rx'
const {of} = $
import {
  compose, last,
} from 'ramda'
import {propTo} from 'util'
import isolate from '@cycle/isolate'
import {
  ListItemWithMenu,
  MenuItem,
} from 'components/sdm'
import {Assignments, Shifts} from 'components/remote'
import {ShiftContentExtra} from 'components/shift'

const Remove = sources => MenuItem({...sources,
  iconName$: $.of('remove'),
  title$: $.of('Remove'),
})

const ShiftItem = sources => {
  const shift$ = sources.item$.pluck('shiftKey')
    .flatMapLatest(Shifts.query.one(sources))
    .shareReplay(1)

  const remove = isolate(Remove)(sources)

  const queue$ = remove.click$
    .withLatestFrom(sources.item$)
    .map(compose(propTo('$key', 'key'), last))
    .map(Assignments.action.remove)

  const li = ListItemWithMenu({
    ...sources,
    ...ShiftContentExtra({
      ...sources,
      item$: shift$,
    }),
    menuItems$: of([remove.DOM]),
  })

  return {
    ...li,
    queue$,
  }
}

export default ShiftItem
