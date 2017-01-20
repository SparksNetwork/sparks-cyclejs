import 'normalize-css'
import 'snabbdom-material/lib/index.css'
import './styles.scss'

import {
  AuthRedirectManager,
  AuthRoute,
  AuthedKeyRoute,
  AuthedResponseManager,
  KeyRoute,
  UserManager,
} from 'helpers/auth'
import {compose, join, omit, pick, propOr} from 'ramda'

import {Observable as $} from 'rx'
import Admin from './Admin'
import Apply from './Apply'
import ApplyToOpp from './ApplyToOpp'
import Confirm from './Confirm'
import Dash from './Dash'
import Engagement from './Engagement'
import Login from './Login'
import Logout from './Logout'
import Opp from './Opp'
import Organize from './Organize'
import Project from './Project'
import {RoutedComponent} from 'components/ui'
import {SideNav} from './SideNav'
import {SwitchedComponent} from 'components/SwitchedComponent'
import Team from './Team'
import {div} from 'helpers'
import isolate from '@cycle/isolate'
import {log} from 'util'
import {siteUrl} from 'util'
const {just, merge} = $

// Route definitions at this level
const _routes = {
  // '/': Landing,
  '/confirm': AuthRoute(isolate(Confirm)),
  '/dash': AuthRoute(isolate(Dash)),
  '/admin': AuthRoute(isolate(Admin)),
  '/project/:key': AuthedKeyRoute(Project, 'projectKey$'),
  '/team/:key': AuthedKeyRoute(Team, 'teamKey$'),
  '/opp/:key': AuthedKeyRoute(Opp, 'oppKey$'),
  '/apply/:key': KeyRoute(Apply, 'projectKey$'),
  '/applyTo/:key': AuthedKeyRoute(ApplyToOpp, 'oppKey$'),
  '/engaged/:key': AuthedKeyRoute(Engagement, 'engagementKey$'),
  '/organize/:key': AuthedKeyRoute(Organize, 'organizerKey$'),
  '/login': Login,
  '/login/:provider': provider => sources =>
    Login({...sources, provider$: just(provider)}),
  '/logout': Logout,
}

const BlankSidenav = () => ({
  DOM: just(div('')),
})

/**
 * Injects path$ and previousRoute$ into component sources
 */
const PathManager = Component => sources => {
  const path$ = sources.router.observable
    .pluck('pathname')
    .shareReplay(1)

  const previousRoute$ = path$
    .scan((acc,val) => [val, acc[0]], [null,null])
    .filter(arr => arr[1] !== '/confirm')
    .map(arr => arr[1])
    .shareReplay(1)

  // confirm redirect doesnt work without this log line!!!  wtf??
  previousRoute$.subscribe(log('index.previousRoute$'))

  return Component({
    ...sources,
    path$,
    previousRoute$,
  })
}

const Root = sources => {
  const nav = SwitchedComponent({...sources,
    Component$: sources.userProfile$
      .map(up => up ? isolate(SideNav) : isolate(BlankSidenav)),
  })

  const page = RoutedComponent({
    ...omit(['path$'], sources),
    routes$: just(_routes),
    navDOM$: nav.DOM,
  })

  const _DOM = page.DOM.shareReplay(1)
  // when done with printing reattach event liteners
  const DOM = _DOM.merge(_DOM.sample(sources.openAndPrint))

  const auth$ = page.auth$

  const focus$ = page.focus$ || $.empty()

  const queue$ = page.queue$ || $.empty()

  const openGraph = merge(
    $.of({site_name: 'Sparks.Network'}),
    sources.path$.map(path => ({url: join('', [siteUrl(), path])})),
    page.openGraph,
  )

  const router = merge(
    page.route$,
    nav.pluck('route$'),
    sources.redirectUnconfirmed$,
  )
  .tap(x => console.log(x))

  // Refresh bugsnag on page change, send user uid
  const bugsnag = merge(
    router.map({action: 'refresh'}),
    sources.auth$.map(authInfo =>
      ({
        action: 'user',
        user: pick(['provider', 'uid'], propOr({}, 'auth', authInfo)),
      }))
  )

  return {
    DOM,
    focus$,
    auth$,
    queue$,
    router,
    bugsnag,
    openAndPrint: page.openAndPrint,
    openGraph,
    csv: page.csv$,
  }
}

/**
* Inject isMobile$ stream into the component sources
*/
const IsMobile = Component => sources => {
  const isMobile$ = sources.screenInfo$
    .map(si => si.size <= 2)
    .shareReplay(1)

  return Component({
    ...sources,
    isMobile$,
  })
}

// The returned component is Root wrapped in each of these helpers
export default compose(
  AuthedResponseManager,
  UserManager,
  AuthRedirectManager,
  IsMobile,
  PathManager,
)(Root)
