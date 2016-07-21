import {Observable as $} from 'rx'
const {just, empty, merge} = $

import isolate from '@cycle/isolate'
import {propOr, pick, join, objOf} from 'ramda'

import AuthRoute from './AuthRoute'
import Login from './Login'
import Logout from './Logout'
import Confirm from './Confirm'
import Dash from './Dash'
import Admin from './Admin'
import Project from './Project'
import Team from './Team'
import Opp from './Opp'
import Apply from './Apply'
import Engagement from './Engagement'
import Organize from './Organize'

import 'normalize-css'
import '!style!css!snabbdom-material/lib/index.css'

import {siteUrl} from 'util'

import {RoutedComponent} from 'components/ui'

import {log} from 'util'
import {div} from 'helpers'

import './styles.scss'

/**
* Returns a function that takes a key and returns a component representing a
* page that requires the user to be logged in, passing the key to the component
* as a stream with .just using the keyName.
*/
const KeyRoute = (component, keyName) => key => AuthRoute(sources =>
  isolate(component)({...sources, ...objOf(keyName, just(key))})
)

// Route definitions at this level
const _routes = {
  // '/': Landing,
  '/confirm': AuthRoute(isolate(Confirm)),
  '/dash': AuthRoute(isolate(Dash)),
  '/admin': AuthRoute(isolate(Admin)),
  '/project/:key': KeyRoute(Project, 'projectKey$'),
  '/team/:key': KeyRoute(Team, 'teamKey$'),
  '/opp/:key': KeyRoute(Opp, 'oppKey$'),
  '/apply/:key': KeyRoute(Apply, 'projectKey$'),
  '/engaged/:key': KeyRoute(Engagement, 'engagementKey$'),
  '/organize/:key': KeyRoute(Organize, 'organizerKey$'),
  '/login': Login,
  '/login/:provider': provider => sources =>
    Login({...sources, provider$: just(provider)}),
  '/logout': Logout,
}

const AuthRedirectManager = sources => {
  const redirectLogin$ = sources.userProfile$
    .filter(Boolean)
    .map(profile => profile.isAdmin ? '/admin' : '/dash')

  //const redirectLogout$ = sources.auth$
  //  .filter(not)
  //  .map(() => { window.location.href = '/' })
    // we want to redirect to the new landing, because the old landing login
    // does not work at all and is sloppy
    // sorry jeremy please fix me to not suck so much
    // I had no time left to do this with a driver :)

  // this is the only global redirect, always gets piped to the router
  const redirectUnconfirmed$ = sources.userProfile$
    .withLatestFrom(sources.auth$)
    .filter(([profile,auth]) => !profile && !!auth)
    .map(() => '/confirm')

  return {
    redirectLogin$,
    //redirectLogout$,
    redirectUnconfirmed$,
  }
}

import {
  Projects,
  Engagements,
} from 'components/remote'

const UserManager = sources => {
  const userProfileKey$ = sources.auth$
    .flatMapLatest(auth =>
      auth ? sources.firebase('Users', auth.uid) : just(null)
    )
    .shareReplay(1)

  const userProfile$ = userProfileKey$
    .distinctUntilChanged()
    .flatMapLatest(key => {
      return key ? sources.firebase('Profiles', key) : just(null)
    })
    .shareReplay(1)

  const userName$ = userProfile$
    .map(up => up && up.fullName || 'None')
    .shareReplay(1)

  const userPortraitUrl$ = userProfile$
    .map(up => up && up.portraitUrl)
    .shareReplay(1)

  const user = {
    projectsOwned$: userProfileKey$
      .flatMapLatest(Projects.query.byOwner(sources)),
    engagements$: userProfileKey$
      .flatMapLatest(Engagements.query.byUser(sources)),
  }

  return {
    userProfile$,
    userProfileKey$,
    userName$,
    userPortraitUrl$,
    user,
  }
}

const AuthedResponseManager = sources => ({
  responses$: sources.auth$
    .flatMapLatest(auth => auth ? sources.queue$(auth.uid) : empty())
    .pluck('val')
    .share(),
})

const AuthedActionManager = sources => ({
  queue$: sources.queue$
    .withLatestFrom(sources.auth$)
    .map(([action,auth]) => ({uid: auth && auth.uid, ...action})),
})

import {SideNav} from './SideNav'
// import {ProfileSidenav} from 'components/profile'
import {pluckLatest, pluckLatestOrNever} from 'util'

const SwitchedComponent = sources => {
  const comp$ = sources.Component$
    .distinctUntilChanged()
    .map(C => isolate(C)(sources))
    .shareReplay(1)

  return {
    pluck: key => pluckLatestOrNever(key, comp$),
    DOM: pluckLatest('DOM', comp$),
    ...['auth$', 'queue$', 'route$'].reduce((a,k) =>
      (a[k] = pluckLatestOrNever(k,comp$)) && a, {}
    ),
  }
}

const BlankSidenav = () => ({
  DOM: just(div('')),
})

export default _sources => {
  const user = UserManager(_sources)

  const redirects = AuthRedirectManager({...user, ..._sources})

  const {responses$} = AuthedResponseManager(_sources)

  const path$ = _sources.router.observable
    .pluck('pathname')
    .shareReplay(1)

  const previousRoute$ = path$
    .scan((acc,val) => [val, acc[0]], [null,null])
    .filter(arr => arr[1] !== '/confirm')
    .map(arr => arr[1])
    .shareReplay(1)

  // confirm redirect doesnt work without this log line!!!  wtf??
  previousRoute$.subscribe(log('index.previousRoute$'))

  const sources = {
    ..._sources,
    ...user,
    ...redirects,
    responses$,
    previousRoute$,
  }

  const nav = SwitchedComponent({...sources,
    Component$: sources.userProfile$
      .map(up => up ? SideNav : BlankSidenav),
  })

  nav.route$.subscribe(x => console.log('navroute',x))

  const page = RoutedComponent({...sources,
    routes$: just(_routes),
    navDOM$: nav.DOM,
  })

  const DOM = page.DOM

  const auth$ = page.auth$

  const focus$ = page.focus$ || $.empty()

  const {queue$} = AuthedActionManager({...sources, queue$: page.queue$})

  const openGraph = merge(
    $.of({site_name: 'Sparks.Network'}),
    path$.map(path => ({url: join('', [siteUrl(), path])})),
    page.openGraph,
  )

  const router = merge(
    page.route$,
    nav.pluck('route$'),
    redirects.redirectUnconfirmed$,
  )

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
  }
}
