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
import 'snabbdom-material/lib/index.css'

import {siteUrl} from 'util'

import {RoutedComponent} from 'components/ui'
import {SwitchedComponent} from 'components/SwitchedComponent'

import {log} from 'util'
import {div} from 'helpers'

import './styles.scss'

/**
* Returns a function that takes a key and returns a component representing a
* page that requires the user to be logged in, passing the key to the component
* as a stream with .just using the keyName.
*/
const KeyRoute = (component, keyName) => key => sources =>
  isolate(component)({...sources, ...objOf(keyName, just(key))})

const AuthedKeyRoute = (component, keyName) => key => AuthRoute(sources =>
  isolate(component)({...sources, ...objOf(keyName, just(key))})
)

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
  '/engaged/:key': AuthedKeyRoute(Engagement, 'engagementKey$'),
  '/organize/:key': AuthedKeyRoute(Organize, 'organizerKey$'),
  '/login': Login,
  '/login/:provider': provider => sources =>
    Login({...sources, provider$: just(provider)}),
  '/logout': Logout,
}

const AuthRedirectManager = sources => {
  const redirectLogin$ = sources.userProfile$
    .filter(Boolean)
    .map(profile => profile.isAdmin ? '/admin' : '/dash')

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

/**
* This can wrap a component and takes an auth$ source, giving the component the
* following additional sources:
*
* - userProfileKey$<Stream<string>>
* - userProfile$<Stream<Object>>
* - userName$<Stream<string>>
* - userPortraitUrl$<Stream<string>>
* - user<Object>
*   - user.projectsOwned$<Stream<Array>>
*   - user.engagements$<Stream<Array>>
*/
const UserManager = component => sources => {
  const auth$ = sources.auth$
    .shareReplay(1)

  const userProfileKey$ = auth$
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

  return component({
    ...sources,
    auth$,
    userProfile$,
    userProfileKey$,
    userName$,
    userPortraitUrl$,
    user,
  })
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

const BlankSidenav = () => ({
  DOM: just(div('')),
})

const Root = _sources => {
  const redirects = AuthRedirectManager(_sources)

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
    ...redirects,
    responses$,
    previousRoute$,
  }

  const nav = SwitchedComponent({...sources,
    Component$: sources.userProfile$
      .map(up => up ? isolate(SideNav) : isolate(BlankSidenav)),
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

  sources.auth$.subscribe(x => console.log('from auth', x))

  return {
    DOM,
    focus$,
    auth$: auth$.tap(x => console.log('sending auth', x)),
    queue$,
    router,
    bugsnag,
    openAndPrint: page.openAndPrint,
    openGraph,
  }
}

const IsMobile = Component => sources => {
  const isMobile$ = sources.screenInfo$
    .map(si => si.size <= 2)
    .shareReplay(1)

  return Component({
    ...sources,
    isMobile$,
  })
}

export default UserManager(IsMobile(Root))
