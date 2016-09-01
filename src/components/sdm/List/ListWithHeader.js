import {Observable as $} from 'rx'
import {div} from 'helpers'
import {requireSources} from 'util'
import {List} from './List'

export const ListWithHeader = sources => {
  requireSources('ListWithHeader', sources, 'rows$', 'headerDOM')

  const list = List(sources)

  const DOM = $.combineLatest(
    sources.headerDOM,
    list.DOM,
    (...doms) => div({}, doms),
  )

  return {
    DOM,
    route$: list.route$,
    queue$: list.queue$,
  }
}
