import {div} from 'cycle-snabbdom'
import {
  always, apply, compose, flip, gt, ifElse, pair, path, prop, subtract,
} from 'ramda'
let counter = 0

function newScope() {
  return `swipeable-${++counter}`
}

const Swipeable = Component => sources => {
  const swipeableScope = newScope()

  const start$ = sources.DOM.select(`.${swipeableScope}`)
    .events('touchstart')

  const end$ = sources.DOM.select(`.${swipeableScope}`)
    .events('touchend')

  const move$ = sources.DOM.select(`.${swipeableScope}`)
    .events('touchmove')

  const swipe$ = start$.flatMapLatest(startEvt =>
    move$
      .filter(
        compose(
          flip(gt)(startEvt.timeStamp),
          prop('timeStamp')
        )
      )
      .takeUntil(end$)
      .map(path(['touches', '0', 'clientX']))
      .map(pair(startEvt.touches[0].clientX))
      .map(apply(subtract))
      .filter(compose(flip(gt)(80), Math.abs))
      .map(ifElse(flip(gt)(0), always('left'), always('right')))
      .distinctUntilChanged()
  )

  const component = Component(sources)
  const DOM = component.DOM.map(dom =>
    div([div(`.swipeable.${swipeableScope}`, [dom])])
  )

  return {
    ...component,
    DOM,
    swipe$,
  }
}

export default Swipeable
