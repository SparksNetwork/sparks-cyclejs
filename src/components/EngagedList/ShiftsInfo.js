import {Observable as $} from 'rx'
const {of} = $
import isolate from '@cycle/isolate'
import {div} from 'cycle-snabbdom'
import {
  compose, of as rof, prop,
} from 'ramda'
import {combineDOMsToDiv, mergeSinks} from 'util'
import {
  List,
  ListItemHeader,
} from 'components/sdm'
import {LoadingCollapsible} from 'components/behaviors/Collapsible'

import AddShift from './AddShift'
import ShiftItem from './ShiftItem'

const ShiftsInfo = sources => {
  const addShift = isolate(AddShift)({
    ...sources,
  })

  const list = List({...sources,
    Control$: of(ShiftItem),
    rows$: sources.assignments$,
  })

  const header = LoadingCollapsible(ListItemHeader)({
    ...sources,
    title$: of('Assigned Shifts'),
    iconName$: of('calendar2'),
    rightDOM$: sources.assignments$.map(compose(div, rof, prop('length'))),
    contentDOM$: combineDOMsToDiv('', addShift, list),
  })

  return {
    ...mergeSinks(addShift, list),
    DOM: header.DOM,
  }
}

export default ShiftsInfo
