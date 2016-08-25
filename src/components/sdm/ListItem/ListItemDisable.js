import {Observable as $} from 'rx'
import {ListItem} from './ListItem'

export const ListItemDisable = sources => {
  const classes$ = (sources.classes$ || $.just({}))
    .map(c => ({disable: true, ...c}))

  return {
    DOM: ListItem({...sources, classes$}).DOM,
  }
}
