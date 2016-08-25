import {Observable as $} from 'rx'
const {just} = $

import {
  ListWithFilter,
} from 'components/sdm'

import {ViewWithDetail} from 'components/ui'

import {
  ProfilesFetcher,
} from './fetcher'

import {ProfileListItem} from './ProfileListItem'
import {ProfileView} from './ProfileView'

require('./styles.scss')

const View = sources => {
  const list = ListWithFilter({
    ...sources,
    rows$: sources.profiles$,
    searchFields$: just(['fullName', 'email', 'phone']),
    Control$: just(ProfileListItem),
  })

  const route$ = list.selected$.map(profile =>
    profile ?
      sources.createHref(`/show/${profile.$key}`) :
      sources.createHref('/'))

  return {
    ...list,
    route$,
  }
}

const ProfileList = sources => {
  return ViewWithDetail({
    ...sources,
    viewControl: View,
    detailControl: ProfileView,
  })
}

export default ProfilesFetcher(ProfileList)
