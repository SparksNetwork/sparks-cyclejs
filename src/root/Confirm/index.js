import {Observable as $} from 'rx'
const {just} = $
import combineLatestObj from 'rx-combine-latest-obj'
import {objOf, not, path, last} from 'ramda'
// import isolate from '@cycle/isolate'

import {Profiles} from 'components/remote'

import SoloFrame from 'components/SoloFrame'
import {ProfileForm} from 'components/ProfileForm'
import {OkAndCancel} from 'components/sdm/Button'
import {pageTitle} from 'helpers'

import {LargeAvatar} from 'components/sdm'

import {div} from 'helpers'

// import {log} from 'util'

const _fromAuthData$ = sources =>
  sources.auth$.filter(Boolean)
    .map(path(['providerData', '0']))
    .map(user => ({
      uid: user.uid,
      fullName: user.displayName,
      email: user.email,
      portraitUrl: user.photoURL,
    }))

export default sources => {
  const authProfile$ = _fromAuthData$(sources)

  const portraitUrl$ = authProfile$.pluck('portraitUrl')

  const pic = LargeAvatar({...sources,
    src$: portraitUrl$,
  })

  const profileForm = ProfileForm({item$: authProfile$, ...sources})

  const profile$ = profileForm.item$
    .combineLatest(
      portraitUrl$,
      (p,portraitUrl) => ({...p, portraitUrl})
    )

  const valid$ = profileForm.valid$

  const buttons = OkAndCancel({
    ...sources,
    okLabel$: just('yep, that\'s me!'),
    cancelLabel$: just('let me login again'),
    disabled$: valid$.map(not),
  })

  const queue$ = profile$
    .sample(buttons.ok$)
    .map(objOf('values'))
    .map(Profiles.action.create)

  const viewState = {
    auth$: sources.auth$,
    userProfile$: sources.userProfile$,
    portraitDOM$: pic.DOM,
    profileFormDOM$: profileForm.DOM,
    buttonsDOM$: buttons.DOM,
  }

  const pageDOM = combineLatestObj(viewState)
    .map(({profileFormDOM, portraitDOM, buttonsDOM}) =>
      div('.narrow', [
      // narrowCol(
        div('.row', [
          div('.col-xs-12.col-sm-6.center',[pageTitle('Is This You?')]),
          div('.col-xs-12.col-sm-6.center',[portraitDOM]),
        ]),
        profileFormDOM,
        buttonsDOM,
      ].filter(Boolean))
    )

  const frame = SoloFrame({pageDOM, ...sources})

  const route$ = $.merge(
    frame.route$,
    // Route to previous route or dashboard if the user is confirmed
    sources.userProfile$.filter(Boolean)
      .withLatestFrom(sources.previousRoute$.filter(Boolean).startWith('/dash'))
      .map(last)
  )

  const auth$ = $.merge(
    frame.auth$,
    buttons.cancel$.map(() => ({type: 'logout'}))
  )
  const DOM = frame.DOM

  return {DOM, route$, queue$, auth$}
}
