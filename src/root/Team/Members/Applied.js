import {Observable} from 'rx'
const {just} = Observable

import {
  List,
  ListItem,
} from 'components/sdm'

import {
  Memberships,
  Profiles,
  Engagements,
} from 'components/remote'

const Item = sources => {
  const eKey$ = sources.item$
    .pluck('engagementKey')

  const eng$ = eKey$
    .flatMapLatest(Engagements.query.one(sources))
    .combineLatest(sources.item$, (e, item) => ({...e, item}))
    .shareReplay(1)

  const profile$ = eng$
    .pluck('profileKey')
    .flatMapLatest(Profiles.query.one(sources))
    .shareReplay(1)

  return ListItem({...sources,
    title$: profile$.pluck('fullName'),
  })
}

const AppList = sources => List({...sources,
  Control$: just(Item),
  rows$: sources.memberships$,
})

const Fetch = sources => ({
  memberships$: sources.teamKey$
    .flatMapLatest(Memberships.query.byTeam(sources)),
})

export default sources => {
  const _sources = {...sources, ...Fetch(sources)}
  const list = AppList(_sources)

  return {
    DOM: list.DOM,
  }
}
