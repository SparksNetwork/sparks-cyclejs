import {Observable as $} from 'rx'
const {of} = $
import {
  prop, propOr,
} from 'ramda'
import {div} from 'cycle-snabbdom'
import {combineDOMsToDiv} from 'util'

import {
  ListItem,
} from 'components/sdm'

import {MediumProfileAvatar} from 'components/profile'

const Avatar = sources => MediumProfileAvatar({...sources,
  profileKey$: sources.engagement$.map(prop('profileKey')),
})

const PersonalInfo = sources => {
  const email = ListItem({...sources,
    title$: sources.profile$.map(prop('email')), subtitle$: of('Email')})
  const phone = ListItem({...sources,
    title$: sources.profile$.map(prop('phone')), subtitle$: of('Phone')})
  const intro = ListItem({...sources,
    title$: sources.profile$.map(propOr('No intro written', 'intro')),
    classes$: of({quote: true})})

  return {
    DOM: combineDOMsToDiv('.col-xs-8', intro, email, phone),
  }
}

const ProfileInfo = sources => ({
  DOM: of(div([
    combineDOMsToDiv('.row',
      Avatar(sources),
      PersonalInfo(sources),
    ),
  ])),
})

export default ProfileInfo
