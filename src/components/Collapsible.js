import {Observable as $} from 'rx'
import combineLatestObj from 'rx-combine-latest-obj'
import Clickable from './Clickable'
import {div} from 'cycle-snabbdom'

export const Collapsible = Component => sources => {
  const clickable = Clickable(Component)(sources)

  const isOpen$ = $.merge(
    sources.isOpen$ || $.just(false),
    clickable.click$.map(-1),
  )
  .scan((acc, next) => next === -1 ? !acc : next, false)
  .startWith(false)

  const viewState = {
    isOpen$: isOpen$,
    clickableDOM$: clickable.DOM,
    contentDOM$: sources.contentDOM$ || $.just(div({},['no contentDOM$'])),
  }

  const DOM = combineLatestObj(viewState)
    .map(({isOpen, clickableDOM, contentDOM}) =>
      div({},[
        clickableDOM,
        isOpen && div('.collapsible',[contentDOM]),
      ].filter(Boolean))
    )

  return {
    ...clickable,
    DOM,
  }
}

export default Collapsible
