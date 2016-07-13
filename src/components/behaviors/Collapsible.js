import {Observable as $} from 'rx'
const {of} = $
import combineLatestObj from 'rx-combine-latest-obj'
import Clickable from './Clickable'
import {div} from 'cycle-snabbdom'
import {
  lensPath, set, compose, not,
} from 'ramda'
import {Loader} from 'components/ui'

const openLens = lensPath(['data', 'class', 'open'])
const closedLens = lensPath(['data', 'class', 'closed'])

const CollapsibleDOM = viewState => {
  return combineLatestObj(viewState)
    .map(({isOpen, clickableDOM, contentDOM}) =>
      div({}, [
        clickableDOM,
        isOpen && div([contentDOM]),
      ].filter(Boolean))
    )
}

export const LoadingCollapsible = Component => sources => {
  const clickable = Clickable(Component)(sources)

  const isOpen$ = $.merge(
    sources.isOpen$ || of(false),
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

  const contentDOM$ = isOpen$
    .filter(Boolean)
    .flatMapLatest(() => sources.contentDOM$)
    .merge(Loader(sources).DOM)

  const DOM = CollapsibleDOM({
    isOpen$: isOpen$,
    clickableDOM$,
    contentDOM$,
  })

  return {
    ...clickable,
    isOpen$,
    DOM,
  }
}

export const Collapsible = Component => sources => {
  const clickable = Clickable(Component)(sources)

  const isOpen$ = $.merge(
    sources.isOpen$ || of(false),
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

  const DOM = CollapsibleDOM({
    isOpen$: isOpen$,
    clickableDOM$,
    contentDOM$,
  })

  return {
    ...clickable,
    isOpen$,
    DOM,
  }
}

export default Collapsible
