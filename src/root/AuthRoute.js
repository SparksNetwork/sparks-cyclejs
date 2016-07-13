import {
  always, ifElse,
} from 'ramda'
import {SwitchedComponent} from 'components/SwitchedComponent'
import Login from 'components/Login'

const AuthRoute = Component => sources => {
  const loggedIn$ = sources.auth$

  return SwitchedComponent({
    ...sources,
    Component$: loggedIn$.map(
      ifElse(Boolean, always(Component), always(Login))
    ),
  })
}

export default AuthRoute
