/**
* Helper components for authentication
*/
import {Observable as $} from 'rx'
const {just, empty} = $
import {
  objOf, always, ifElse,
} from 'ramda'
import isolate from '@cycle/isolate'

import {
  Projects,
  Engagements,
} from 'components/remote'

import {SwitchedComponent} from 'components/SwitchedComponent'
import Login from 'components/Login'

/**
 * Injects redirectLogin$ and redirectUnconfirmed$ into component sources
 *
 * - redirectLogin$: When the logged in user is admin emits /admin,
 * otherwise /dash
 * - redirectUnconfirmed$: Emits /confirm when the user is logged in but has
 * no profile
 *
 */
export const AuthRedirectManager = Component => sources => {
  const redirectLogin$ = sources.userProfile$
    .filter(Boolean)
    .map(profile => profile.isAdmin ? '/admin' : '/dash')

  // this is the only global redirect, always gets piped to the router
  const redirectUnconfirmed$ = sources.userProfile$
    .withLatestFrom(sources.auth$)
    .filter(([profile,auth]) => !profile && !!auth)
    .map(() => '/confirm')

  return Component({
    ...sources,
    redirectLogin$,
    redirectUnconfirmed$,
  })
}

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
export const UserManager = component => sources => {
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

/**
 * Inject responses$ into the component sources and map component sinks queue$
 * with the authenticated users uid
 */
export const AuthedResponseManager = Component => sources => {
  const sinks = Component({
    ...sources,
    responses$: sources.auth$
      .flatMapLatest(auth => auth ? sources.queue$(auth.uid) : empty())
      .pluck('val')
      .share(),
  })

  const queue$ = sinks.queue$
    .withLatestFrom(sources.auth$)
    .map(([action,auth]) => ({uid: auth && auth.uid, ...action}))

  return {
    ...sinks,
    queue$,
  }
}

/**
 * Wrap a component in a SwitchedComponent that will switch to the Login
 * component if the user is not logged in
 */
export const AuthRoute = Component => sources => {
  const loggedIn$ = sources.auth$

  return SwitchedComponent({
    ...sources,
    Component$: loggedIn$.map(
      ifElse(Boolean, always(Component), always(Login))
    ),
  })
}

/**
* Returns a function that takes a key and returns a component representing a
* page that passes the key to the component as a stream with .just using the
* keyName.
*/
export const KeyRoute = (component, keyName) => key => sources =>
  isolate(component)({...sources, ...objOf(keyName, just(key))})

/**
* Returns a function that takes a key and returns a component representing a
* page that requires the user to be logged in, passing the key to the component
* as a stream with .just using the keyName.
*/
export const AuthedKeyRoute = (component, keyName) => key =>
  AuthRoute(sources =>
    isolate(component)({...sources, ...objOf(keyName, just(key))})
)
