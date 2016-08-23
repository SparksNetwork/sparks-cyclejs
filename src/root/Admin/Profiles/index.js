import {Observable as $} from 'rx'
const {just} = $
import {mergeSinks} from 'util'
import {prop} from 'ramda'

import {
  ListWithFilter,
} from 'components/sdm'

import {
  ProfilesFetcher,
} from './fetcher'

import {ProfileListItem} from './ProfileListItem'
import {ProfileView} from './ProfileView'

require('./styles.scss')

const Profiles = unfetchedSources => {
  const sources = {...unfetchedSources, ...ProfilesFetcher(unfetchedSources)}

  const list = ListWithFilter({
    ...sources,
    rows$: sources.profiles$,
    searchFields$: just(['fullName', 'email', 'phone']),
    Control$: just(ProfileListItem),
  })

  const control$ = list.selected$.map(profile =>
      profile ?
        ProfileView({...sources, profile$: just(profile)}) :
        list
    )
    .shareReplay(1)

  return {
    ...mergeSinks(control$),
    DOM: control$.map(prop('DOM')).switch(),
  }
}

export default Profiles
