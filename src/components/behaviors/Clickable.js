import {lensPath, set} from 'ramda'
import {div} from 'cycle-snabbdom'
require('./Clickable.scss')
let counter = 0

function newScope() {
  return `clickable-${++counter}`
}

const classLens = name => lensPath(['data', 'class', name])
const classSet = name => set(classLens(name), true)

export const Clickable = Component => sources => {
  const clickableScope = newScope()
  const click$ = sources.DOM.select(`.${clickableScope}`).events('click')
    .tap(evt => evt.preventDefault())
  const component = Component(sources)
  const DOM = component.DOM.map(dom =>
    div([div(`.clickable.${clickableScope}`, [dom])])
  )

  return {
    ...component,
    DOM,
    click$,
  }
}

export const ClickableRaw = Component => sources => {
  const clickableScope = newScope()
  const click$ = sources.DOM.select(`.${clickableScope}`).events('click')
    .tap(evt => evt.preventDefault())
  const component = Component(sources)
  const DOM = component.DOM
    .map(classSet(clickableScope))

  return {
    ...component,
    DOM,
    click$,
  }
}

export default Clickable
