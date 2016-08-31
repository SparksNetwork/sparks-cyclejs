import {pathOr} from 'ramda'
import {formatTime, requireSources} from 'util'
import {ListItem} from 'components/sdm'

export const ArrivalListItem = sources => {
  requireSources('ArrivalListItem', sources, 'item$')
  const arr$ = sources.item$

  return ListItem({
    ...sources,
    title$: arr$.map(pathOr('err', ['project', 'name'])),
    subtitle$: arr$.map(arr =>
      `At ${formatTime(arr.arrivedAt)}`),
  })
}
