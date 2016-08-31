import {Observable as $} from 'rx'
const {of} = $
import {requireSources} from 'util'

import {
  ListWithFilter,
} from 'components/sdm'

import {ViewWithDetail} from 'components/ui'

import {EngagementView} from './EngagementView'
import Item from './Item'
import {ProfilesFetcher} from './fetch'

const AppList = sources => ListWithFilter({...sources,
  Control$: of(Item),
  rows$: sources.profiles$,
  searchFields$: of([
    ['profile', 'fullName'],
    ['profile', 'email'],
    ['profile', 'phone'],
  ]),
})

const View = sources => {
  return ProfilesFetcher(AppList)(sources)
}

const EngagedList = sources => {
  requireSources('EngagedList', sources, 'engagements$')

  return ViewWithDetail({
    ...sources,
    viewControl: View,
    detailControl: EngagementView,
  }, {name: 'engagement'})
}

export default EngagedList
