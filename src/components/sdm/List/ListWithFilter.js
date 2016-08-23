import {Observable as $} from 'rx'
const {merge, combineLatest} = $
import {combineDOMsToDiv} from 'util'
import {List} from './List'
import {InputControl} from 'components/sdm'
import isolate from '@cycle/isolate'
import {div} from 'cycle-snabbdom'
import {
  compose, any, prop, split, toLower, join, props, complement, isEmpty, ifElse,
  take, useWith, filter, allPass, always, map, propEq, head,
} from 'ramda'
import {mergeSinks} from 'util'

const matchesTerm = (term) =>
  compose(any(text => text.includes(term)), prop('filter'))

const prepareText = compose(
  split(' '),
  toLower,
  join(' '),
  props
)

const SearchBox = sources => {
  const focus$ = sources.DOM.select('.list-filter').observable
    .filter(complement(isEmpty))
    .map({selector: '.list-filter input'})

  const input = isolate(InputControl)({
    label$: $.of('Search'),
    ...sources,
  })

  const vtree$ = input.DOM.map(i =>
    div([div('.list-filter', [i])]))

  return {
    ...input,
    DOM: vtree$,
    focus$,
    term$: input.value$,
  }
}

const ListWithFilter = sources => {
  const searchBox = isolate(SearchBox)(sources)
  const term$ = searchBox.term$
    .map(ifElse(Boolean, toLower, always('')))
    .distinctUntilChanged()
    .shareReplay(1)

  const searchFields$ = sources.searchFields$

  const preparedRows$ = combineLatest(sources.rows$, searchFields$)
    .map(([rows, fields]) =>
      rows.map(row => ({...row, filter: prepareText(fields, row)}))
    )
    .startWith([])

  const preparedTerm$ = term$.map(compose(map(matchesTerm), split(' ')))

  const rows$ = combineLatest(preparedTerm$, preparedRows$,
    compose(
      take(20),
      useWith(filter, [allPass])
    )
  )
  .shareReplay(1)

  const list = List({
    ...sources,
    rows$,
  })

  const DOM = combineDOMsToDiv('', searchBox, list)

  const oneRow$ = rows$
    .filter(propEq('length', 1))
    .map(head)

  const selected$ = merge(
    oneRow$,
    list.pluck('click$'),
    //searchBox.key$.map(always(null))
  )

  return {
    ...mergeSinks(searchBox, list),
    DOM,
    selected$,
  }
}

export {ListWithFilter}
