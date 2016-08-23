import {Observable as $} from 'rx'
import isolate from '@cycle/isolate'
import {mergeSinks} from 'util'
import {
  allPass, always, any, complement, compose, filter, head,
  ifElse, isEmpty, join, map, prop, propEq, props, split,
  take, toLower, useWith,
} from 'ramda'

import {div} from 'cycle-snabbdom'
import {combineDOMsToDiv} from 'util'

import {iconSrc} from 'helpers'

import {
  List,
  ListItemClickable,
  InputControl,
} from 'components/sdm'

import {
  ProfilesFetcher,
} from './fetcher'

import {ProfileView} from './ProfileView'

require('./styles.scss')

const SearchBox = sources => {
  const focus$ = sources.DOM.select('.profiles-search').observable
    .filter(complement(isEmpty))
    .map({selector: '.profiles-search input'})

  const input = isolate(InputControl)({
    label$: $.of('Search'),
    ...sources,
  })

  const vtree$ = input.DOM.map(i =>
    div('.profiles-search', [i]))

  return {
    ...input,
    DOM: vtree$,
    focus$,
    term$: input.value$,
  }
}

const ProfileListItem = sources => {
  const profile$ = sources.item$

  const icon$ = profile$.map(profile =>
    div('.profile-portrait', [
      iconSrc(profile.portraitUrl),
    ]))

  const li = isolate(ListItemClickable)({
    ...sources,
    title$: profile$.pluck('fullName'),
    subtitle$: profile$.pluck('email'),
    leftDOM$: icon$,
  })

  return {
    ...li,
  }
}

const ProfileList = sources => ({
  ...List({
    ...sources,
    Control$: $.just(ProfileListItem),
    rows$: sources.profiles$,
  }),
})

const SearchResults = sources => {
  const profiles$ = sources.profiles$

  const oneProfile$ = profiles$
    .map(propEq('length', 1))
    .distinctUntilChanged()
    .shareReplay(1)

  const control$ = oneProfile$.map(oneProfile =>
    oneProfile ?
      ProfileView({
        ...sources,
        profile$: profiles$.map(head),
      }) :
      ProfileList(sources))
    .shareReplay(1)

  return {
    DOM: control$.map(prop('DOM')).switch(),
    ...mergeSinks(control$),
  }
}

const profileMatchesTerm = (term) =>
  compose(any(text => text.includes(term)), prop('search'))

const prepareText = compose(
  split(' '),
  toLower,
  join(' ')
)

const prepareProfile = profile =>
  ({...profile,
    search: prepareText(props(['fullName', 'email', 'phone'], profile))})

const Profiles = unfetchedSources => {
  const sources = {...unfetchedSources, ...ProfilesFetcher(unfetchedSources)}

  const preparedProfiles$ = sources.profiles$
    .map(map(prepareProfile))
    .shareReplay(1)

  const searchBox = SearchBox(sources)
  const term$ = searchBox.term$
    .map(ifElse(Boolean, toLower, always('')))
    .distinctUntilChanged()
    .shareReplay(1)

  const preparedTerm$ = term$
    .map(compose(map(profileMatchesTerm), split(' ')))

  const profiles$ = $.combineLatest(
    preparedTerm$,
    preparedProfiles$,
    compose(
      take(20),
      useWith(filter, [allPass])
    )
  )
  .startWith([])
  .shareReplay(1)

  const list = SearchResults({...sources, profiles$, key$: searchBox.key$})
  const DOM = combineDOMsToDiv('', searchBox, list)

  return {
    ...mergeSinks(searchBox, list),
    DOM,
  }
}

export default Profiles
