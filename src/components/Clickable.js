import {div} from 'cycle-snabbdom'
require('./Clickable.scss')
let counter = 0

function newScope() {
  return `clickable-${++counter}`
}

export const Clickable = Component => sources => {
  const clickableScope = newScope()
  const click$ = sources.DOM.select(`.${clickableScope}`).events('click')
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

export default Clickable
