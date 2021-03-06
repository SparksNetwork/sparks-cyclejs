import {requireSources, mergeOrFlatMapLatest, controlsFromRows} from 'util'

export const PartialList = sources => {
  requireSources('List', sources, 'rows$', 'Control$')

  const controls$ = sources.rows$
    .flatMapLatest(rows =>
      sources.Control$.map(Control =>
        controlsFromRows(sources, rows, Control)
      )
    )
    .shareReplay(1)

  const contents$ = controls$.map(ctrls => ctrls.map(ctrl => ctrl.DOM))

  const route$ = controls$.flatMapLatest(children =>
    mergeOrFlatMapLatest('route$', ...children)
  )

  const queue$ = controls$.flatMapLatest(children =>
    mergeOrFlatMapLatest('queue$', ...children)
  )

  const edit$ = controls$.flatMapLatest(children =>
    mergeOrFlatMapLatest('edit$', ...children)
  )

  const lastIndex$ = controls$.flatMapLatest(children =>
    mergeOrFlatMapLatest('lastIndex$', ...children)
  )

  const assignment$ = controls$.flatMapLatest(c =>
    mergeOrFlatMapLatest('assignment$', ...c)
  )

  const date$ = controls$.flatMapLatest(c =>
    mergeOrFlatMapLatest('date$', ...c)
  )

  return {
    contents$,
    queue$,
    route$,
    edit$,
    lastIndex$,
    assignment$,
    date$,
  }
}
