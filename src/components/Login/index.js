import {Observable as $} from 'rx'
const {just} = $
import {div, button, i} from 'cycle-snabbdom'
import {PROVIDERS, combineDOMsToDiv} from 'util'
import Clickable from 'components/behaviors/Clickable'
import styles from './styles.scss'

const LoginButton = sources => {
  const icon$ = sources.icon$
  const type$ = sources.type$
  const label$ = sources.label$

  const innerButton = Clickable(() => {
    return {
      DOM: $.combineLatest(icon$, type$, label$)
        .map(([icon, type, label]) =>
          div([
            button(`.${type}.sign-in`, [
              i(`.icon-${icon}`),
              label,
            ]),
          ])
        ),
    }
  })(sources)

  const auth$ = type$.flatMapLatest(type =>
    innerButton.click$.map(() => PROVIDERS[type])
  )

  return {
    DOM: innerButton.DOM,
    auth$,
  }
}

const LoginButtons = sources => {
  const google = LoginButton({
    ...sources,
    type$: just('google'),
    icon$: just('google'),
    label$: just('Sign in with Google'),
  })

  const fb = LoginButton({
    ...sources,
    type$: just('facebook'),
    icon$: just('facebook-official'),
    label$: just('Sign in with Facebook'),
  })

  return {
    DOM: combineDOMsToDiv('.buttons', google, fb),
    auth$: $.merge(google.auth$, fb.auth$),
  }
}

const Login = sources => {
  const buttons = LoginButtons(sources)

  const DOM = buttons.DOM.map(buttonsDOM =>
    div('.sparks-dialog', [
      div(`.${styles['interstitial-login']}`, [
        div('.logo', []),
        div('We need to know who you are'),
        buttonsDOM,
      ]),
    ])
  )

  return {
    DOM,
    auth$: buttons.auth$,
  }
}

export default Login
