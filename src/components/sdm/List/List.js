import {Observable as $} from 'rx'
const {just} = $
import {div} from 'helpers'
import {requireSources, mergeOrFlatMapLatest, controlsFromRows} from 'util'
import {combineDOMsToDiv} from 'util'

export const List = sources => {
  requireSources('List', sources, 'rows$', 'Control$')

  const controls$ = sources.rows$
    .startWith([])
    .flatMapLatest(rows =>
      sources.Control$.map(Control =>
        controlsFromRows(sources, rows, Control)
      )
    )
    .shareReplay(1)

  const DOM = controls$
    .map(controls => controls.length > 0 ?
      combineDOMsToDiv('.list', ...controls) :
      just(div('',[]))
    ).switch()

  const pluck = key => controls$.flatMapLatest(children =>
    mergeOrFlatMapLatest(key, ...children)
  )

  return {
    DOM,
    queue$: pluck('queue$'),
    route$: pluck('route$'),
    edit$: pluck('edit$'),
    lastIndex$: pluck('lastIndex$'),
    assignment$: pluck('assignment$'),
    date$: pluck('date$'),
    pluck,
  }
}
