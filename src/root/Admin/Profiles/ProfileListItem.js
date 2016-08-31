import {div} from 'cycle-snabbdom'
import {iconSrc} from 'helpers'
import {Clickable} from 'components/behaviors'
import {ListItem} from 'components/sdm'

const ProfileListItem = sources => {
  const profile$ = sources.item$

  const icon$ = profile$.map(profile =>
    div('.profile-portrait', [
      iconSrc(profile.portraitUrl),
    ]))

  const li = Clickable(ListItem)({
    ...sources,
    title$: profile$.pluck('fullName'),
    subtitle$: profile$.pluck('email'),
    leftDOM$: icon$,
  })

  return {
    ...li,
    click$: profile$.sample(li.click$),
  }
}

export {ProfileListItem}

