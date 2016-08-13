import {Observable as $} from 'rx'
const {combineLatest, just, merge} = $
import {not, identity, replace} from 'ramda'
import {RaisedButton} from 'components/sdm'
import {combineDOMsToDiv} from 'util'
import {div} from 'cycle-snabbdom'

const renderLabel = provider => replace('{{provider}}', provider)

const Login = sources => {
  const provider$ = sources.provider$ || $.empty()

  const labelTemplate$ = sources.label$ || just('Login with {{provider}}')
  const googLabel$ = labelTemplate$.map(renderLabel('Google'))
  const fbLabel$ = labelTemplate$.map(renderLabel('Facebook'))

  const goog = RaisedButton({...sources, label$: googLabel$})
  const fb = RaisedButton({...sources, label$: fbLabel$})
  const loginDOM = combineDOMsToDiv('', goog, fb)

  const DOM = merge(
    combineLatest(
      loginDOM,
      provider$.isEmpty().filter(Boolean),
      identity
    ),
    combineLatest(
      just(div('Redirecting...')),
      provider$.isEmpty().filter(not),
      identity
    )
  )

  const auth$ = $.combineLatest(
      provider$,
      $.merge(
        sources.auth$.isEmpty().filter(Boolean),
        sources.auth$.filter(not)
      ),
    )
    .map(([provider]) => ({
      type: 'redirect',
      provider,
    }))

  const route$ = merge(
    sources.auth$.filter(Boolean).map('/dash'),
    goog.click$.map('/login/google'),
    fb.click$.map('/login/facebook')
  )

  return {
    DOM,
    auth$,
    route$,
  }
}

export default Login
