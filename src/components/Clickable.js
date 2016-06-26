import {div} from 'cycle-snabbdom'

export const Clickable = Component => sources => {
  const component = Component(sources)

  const DOM = component.DOM.map(dom =>
    div('.clickable', [dom])
  )

  const click$ = sources.DOM.select('.clickable').events('click')

  return {
    ...component,
    DOM,
    click$,
  }
}

export default Clickable
