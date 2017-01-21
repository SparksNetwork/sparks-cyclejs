/**
* Helper components for authentication
*/
import {Observable as $} from 'rx'
const {just, empty, combineLatest, merge} = $
import {
  objOf, always, ifElse, compose, cond, nth, head, split, prop, join, T, test,
  identity,
} from 'ramda'
import isolate from '@cycle/isolate'

import {
  Profiles,
  Projects,
  Engagements,
} from 'components/remote'
import {requireSources} from 'util'

import {SwitchedComponent} from 'components/SwitchedComponent'
import Login from 'components/Login'

/**
 * Injects redirectLogin$ and redirectUnconfirmed$ into component sources
 *
 * - redirectLogin$: When the logged in user is admin emits /admin,
 * otherwise /dash
 * - redirectUnconfirmed$: Emits /confirm when the user is logged in but has
 * no profile
 */
export const AuthRedirectManager = component => sources => {
  const redirectLogin$ = sources.userProfile$
    .filter(Boolean)
    .map(profile => profile.isAdmin ? '/admin' : '/dash')

  // this is the only global redirect, always gets piped to the router
  const redirectUnconfirmed$ = sources.userProfile$
    .withLatestFrom(sources.auth$)
    .filter(([profile,auth]) => !profile && !!auth)
    .map(() => '/confirm')

  return component({
    ...sources,
    redirectLogin$,
    redirectUnconfirmed$,
  })
}

/**
 * Inject a component with a userProfileKey$ source
 */
export const UserProfileKey = component => sources => {
  requireSources('UserProfileKey', sources, 'auth$')

  return component({
    ...sources,
    userProfileKey$: sources.auth$
      .flatMapLatest(auth =>
        auth ? sources.firebase('Users', auth.uid) : just(null)
      )
      .shareReplay(1),
  })
}

/**
 * Convert firebase 2 users to firebase 3 users. This wraps a component and
 * intercepts userProfileKey$. When that stream is emitting null and auth$ is
 * emitting something then it will try to look up a firebase 2 user using the
 * uid in the auth providerData object. If it finds an older user it will
 * replace userProfileKey$ and put a message on the queue for the backend to
 * migrate the user's data.
 */
export const ProfileMigration = component => sources => {
  requireSources('ProfileMigration', sources, 'userProfileKey$', 'auth$',
    'firebase')

  const migrated$ = combineLatest(sources.auth$, sources.userProfileKey$)
    .flatMapLatest(cond([
      // If there's a key just return it
      [nth(1), ([, profileKey]) => just({migrate: false, profileKey})],
      // If no key and there is a user migrate it
      [nth(0), ([auth]) => {
        // Construct the old uid:
        const provider = auth.providerData[0]
        const name = compose(head, split('.'), prop('providerId'))(provider)

        // If the old uid is in the format xxx-xxx-xxx then use it directly,
        // otherwise prepend the provider name, i.e. google:1234
        const uidReplacer = cond([
          [test(/.+-.+/), identity],
          [T, uid => join(':', [name, uid])],
        ])

        const uid = uidReplacer(provider.uid)

        // Email search isn't reliable, but we do know that the email
        // provided by firebase 3 is the one owned by the user
        const email = auth.email || provider.email
        const byEmail$ = (email ?
          Profiles.query.byEmail(sources)(email) : just([]))
          .map(head)
          .map(p => p ? p.$key : null)

        const byUid$ = sources.firebase('Users', uid)

        // Search, only migrate if found
        return combineLatest(byUid$, byEmail$)
          .map(([uiduid, emailuid]) => uiduid || emailuid)
          .map(profileKey => ({
            migrate: Boolean(profileKey),
            profileKey,
            fromUid: uid,
            toUid: auth.uid,
          }))
      }],

      // Else: fall through with a null key
      [T, () => just({migrate: false, profileKey: null})],
    ]))
    .shareReplay(1)

  const userProfileKey$ = migrated$.map(prop('profileKey'))

  const sinks = component({
    ...sources,
    userProfileKey$,
  })

  const queue$ = merge(
    sinks.queue$,
    migrated$.filter(prop('migrate')).map(({profileKey, fromUid, toUid}) => ({
      domain: 'Users',
      action: 'migrate',
      payload: {profileKey, fromUid, toUid},
    })),
  )

  return {
    ...sinks,
    queue$,
  }
}

/**
* inject a component with the following additional sources:
*
* - userProfile$<Stream<Object>>
* - userName$<Stream<string>>
* - userPortraitUrl$<Stream<string>>
* - user<Object>
*   - user.projectsOwned$<Stream<Array>>
*   - user.engagements$<Stream<Array>>
*/
const UserProfileFetcher = component => sources => {
  requireSources('UserProfileFetcher', sources, 'userProfileKey$', 'firebase')

  const userProfile$ = sources.userProfileKey$
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
    projectsOwned$: sources.userProfileKey$
      .flatMapLatest(Projects.query.byOwner(sources)),
    engagements$: sources.userProfileKey$
      .flatMapLatest(Engagements.query.byUser(sources)),
  }

  return component({
    ...sources,
    userProfile$,
    userName$,
    userPortraitUrl$,
    user,
  })
}

/**
 * Combine the injections for the user profiles and so forth
 */
export const UserManager = component => sources => {
  return compose(
    UserProfileKey,
    ProfileMigration,
    UserProfileFetcher,
  )(component)({
    ...sources,
    auth$: sources.auth$.shareReplay(1),
  })
}

/**
 * Inject responses$ into the component sources and map component sinks queue$
 * with the authenticated users uid
 */
export const AuthedResponseManager = component => sources => {
  const sinks = component({
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
