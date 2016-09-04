import {Observable as $} from 'rx'
const {merge, combineLatest} = $
import {combineDOMsToDiv} from 'util'
import {List} from './List'
import {InputControl} from 'components/sdm'
import isolate from '@cycle/isolate'
import {div} from 'cycle-snabbdom'
import {
  allPass, always, any, complement, compose, filter, flatten, flip, head,
  ifElse, isEmpty, join, map, of, path, prop, propEq, split, take, toLower,
  useWith,
} from 'ramda'
import {mergeSinks} from 'util'

const matchesTerm = (term) =>
  compose(any(text => text.includes(term)), prop('filter'))

const extractProps = (props, obj) =>
  map(compose(flip(path)(obj), flatten, of))(props)

const prepareText = compose(
  split(' '),
  toLower,
  join(' '),
  extractProps,
)

const SearchBox = sources => {
  const focus$ = sources.DOM.select('.list-filter').observable
    .filter(complement(isEmpty))
    .first()
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

  const allRows$ = combineLatest(preparedTerm$, preparedRows$,
    compose(
      // take(20),
      useWith(filter, [allPass])
    )
  )
  .shareReplay(1)

  const rowLimit$ = sources.rowLimit$ || $.just(20)
  const rows$ = combineLatest(rowLimit$, allRows$, take)

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
