import {Observable as $} from 'rx'
import combineLatestObj from 'rx-combine-latest-obj'

import {div} from 'cycle-snabbdom'

import {ListItemClickable} from './ListItemClickable'
import {ListItemDisable} from './ListItemDisable'
import {Menu} from 'components/sdm'

/**
 * View component which displays :
 * 1. a menu
 * 2. a list of items
 * @param sources
 * Mandatory extra sources (vs. `main`'s sources) include:
 * Optional extra sources include :
 * - menuItems$ : items to display in the menu
 * - title$ : title of the list item drop down
 * - subtitle$
 * - iconName$ : icon identifier for list item drop down
 * - classes$
 * - leftDOM$
 * - rightDOM$
 * - isVisible$
 * - disable$ [^false|] : determines whether the drop down list item is disabled (`^true|`) or not
 * @returns {{DOM: Observable<VDOM>}}
 * @constructor
 */
export const ListItemWithMenu = sources => {
  // Set values of optional sources
  sources.disable$ = (sources.disable$ || $.just(false)).share()

  const item$ = sources.disable$
    .map(disable => disable ?
      ListItemDisable(sources) :
      ListItemClickable(sources)
    )
    .share()

  const isOpen$ = sources.disable$
    .flatMapLatest(disable => (disable ?
          $.empty() :
          // item$.pluck('click$') // For some reasons, that does not work, but ListItemClickable(sources).click$ does...
          ListItemClickable(sources).click$
      ).map(true).startWith(false)
    )

  const children$ = sources.menuItems$ || $.just([])

  const menu = Menu({
    ...sources,
    isOpen$,
    children$,
  })

  const viewState = {
    itemDOM$: item$.pluck('DOM'),
    menuDOM$: menu.DOM,
  }

  const DOM = combineLatestObj(viewState)
    .map(({itemDOM, menuDOM}) =>
      div({}, [itemDOM, menuDOM])
    )

  return {
    DOM,
  }
}
