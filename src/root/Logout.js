import {Observable as $} from 'rx'
const {just} = $
import {not} from 'ramda'
import {div} from 'cycle-snabbdom'
import {PROVIDERS} from 'util'

const Logout = sources => {
  sources.auth$
    .filter(not)
    .subscribe(() => window.location.href = '/')

  return {
    DOM: just(div('please wait...')),
    auth$: just(PROVIDERS.logout),
  }
}

export default Logout
