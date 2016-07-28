import {Observable as $} from 'rx'
const {just, merge, combineLatest} = $
import {div} from 'cycle-snabbdom'
import {lr} from 'util'
import {
  not, always, identity,
} from 'ramda'

const AuthRoute = Component => sources => {
  const loggedIn$ = sources.auth$.filter(Boolean)
  const notLoggedIn$ = sources.auth$.filter(not)

  const component = Component(sources)

  const waitingDOM = just(div('waiting dom'))

  const DOM = merge(
    combineLatest(waitingDOM, notLoggedIn$, identity),
    combineLatest(component.DOM, loggedIn$, identity)
  )

  const route$ = merge(
    combineLatest(just('/login'), notLoggedIn$, identity),
    combineLatest(component.route$, loggedIn$, identity)
  )

  route$.subscribe(x => console.log('route', x))

  return {
    ...component,
    DOM,
    route$,
  }
}

export default AuthRoute
