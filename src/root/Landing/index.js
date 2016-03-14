import {Observable} from 'rx'

import AppMenu from 'components/AppMenu'
import {PROVIDERS} from 'util'
import {landing} from 'helpers'

import './styles.scss'

export default (sources) => {
  const appMenu = AppMenu(sources)

  const facebook$ = sources.DOM.select('.signup .facebook').events('click')
    .map(() => PROVIDERS.facebook)

  const google$ = sources.DOM.select('.signup .google').events('click')
    .map(() => PROVIDERS.google)

  const authActions$ = Observable.merge(appMenu.auth$, facebook$, google$)

  return {
    DOM: appMenu.DOM.map(landing),
    auth$: authActions$,
    route$: sources.redirectLogin$,
  }
}