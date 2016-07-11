import {Observable} from 'rx'
const {of, combineLatest} = Observable
import {
  equals, objOf,
} from 'ramda'

import {
  Profiles,
} from 'components/remote'

import {
  ListItem,
} from 'components/sdm'

import {ProfileAvatar} from 'components/profile'

import {div} from 'helpers'

const QuotingListItem = sources => {
  const profile$ = sources.profileKey$
    .flatMapLatest(Profiles.query.one(sources))
  const right$ = sources.right$ || of(false)

  const classes$ = combineLatest(
    sources.classes$ || of({}),
    right$,
  )
  .map(([classes, right]) => ({...classes, quote: true, right: right}))

  const li = ListItem({...sources,
    subtitle$: of(''),
    classes$,
  }) // uses title$

  const liq = ListItem({...sources,
    leftDOM$: right$.filter(equals(false))
      .flatMapLatest(ProfileAvatar(sources).DOM).startWith(null),
    rightDOM$: right$.filter(equals(true))
      .flatMapLatest(ProfileAvatar(sources).DOM).startWith(null),
    title$: profile$.map(p => p && p.fullName),
    subtitle$: sources.subtitle$ || of(''),
    classes$: right$.map(objOf('right')),
  })

  const DOM = combineLatest(
    li.DOM,
    liq.DOM,
    (...doms) => div({},doms)
  )

  return {
    DOM,
  }
}

export {QuotingListItem}
