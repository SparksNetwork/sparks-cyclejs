import {Observable as $} from 'rx'
import {Clickable, ClickableRaw} from './Clickable'

export const Navigatable = Component => sources => {
  const component = Clickable(Component)(sources)
  const path$ = sources.path$ || $.just('/')

  const route$ = component.click$
    .withLatestFrom(
      path$,
      (click,path) => path
    )

  return {
    ...component,
    route$,
  }
}

export const NavigatableRaw = Component => sources => {
  const component = ClickableRaw(Component)(sources)
  const path$ = sources.path$ || $.just('/')

  const route$ = component.click$
    .withLatestFrom(
      path$,
      (click,path) => path
    )

  return {
    ...component,
    route$,
  }
}

export default Navigatable
