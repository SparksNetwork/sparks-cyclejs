import {Observable as $} from 'rx'
const {of} = $
import {div} from 'cycle-snabbdom'
import {
  compose, of as rof, prop,
} from 'ramda'
import {combineDOMsToDiv} from 'util'
import {
  List,
  ListItemHeader,
} from 'components/sdm'
import Collapsible from 'components/behaviors/Collapsible'
import ShiftItem from './ShiftItem'

const ShiftsInfo = sources => {
  const list = List({...sources,
    Control$: of(ShiftItem),
    rows$: sources.assignments$,
  })

  const header = Collapsible(ListItemHeader)({
    ...sources,
    title$: of('Assigned Shifts'),
    iconName$: of('calendar2'),
    rightDOM$: sources.assignments$.map(compose(div, rof, prop('length'))),
    contentDOM$: combineDOMsToDiv('', list),
  })

  return {
    ...list,
    DOM: header.DOM,
  }
}

export default ShiftsInfo
