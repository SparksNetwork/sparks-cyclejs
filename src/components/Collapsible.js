import {Observable as $} from 'rx'
const {of} = $
import combineLatestObj from 'rx-combine-latest-obj'
import Clickable from './Clickable'
import {div} from 'cycle-snabbdom'
import {
  lensPath, set, compose, not,
} from 'ramda'

const openLens = lensPath(['data', 'class', 'open'])
const closedLens = lensPath(['data', 'class', 'closed'])

export const Collapsible = Component => sources => {
  const clickable = Clickable(Component)(sources)

  const isOpen$ = $.merge(
    sources.isOpen$ || $.just(false),
    clickable.click$.map(-1),
  )
  .scan((acc, next) => next === -1 ? !acc : next, false)
  .startWith(false)

  const clickableDOM$ = $.combineLatest(
    isOpen$,
    clickable.DOM
  )
  .map(([open, dom]) => compose(
      set(openLens, open),
      set(closedLens, not(open))
    )(dom)
  )

  const contentDOM$ = sources.contentDOM$ || of(div({}, ['no ContentDOM$']))

  const viewState = {
    isOpen$: isOpen$,
    clickableDOM$,
    contentDOM$,
  }

  const DOM = combineLatestObj(viewState)
    .map(({isOpen, clickableDOM, contentDOM}) =>
      div({}, [
        clickableDOM,
        isOpen && div([contentDOM]),
      ].filter(Boolean))
    )

  return {
    ...clickable,
    DOM,
  }
}

export default Collapsible
