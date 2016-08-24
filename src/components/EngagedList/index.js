import {Observable as $} from 'rx'
const {of} = $
import {div} from 'helpers'
import {combineLatestToDiv} from 'util'

import {
  ListWithFilter,
} from 'components/sdm'

import {ViewWithDetail} from 'components/ui'

import Detail from './Detail'
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

const EmptyNotice = sources => ({
  DOM: sources.items$.map(i =>
    i.length > 0 ? null : div({},['Empty notice'])
  ),
})

const View = sources => {
  const mt = EmptyNotice({...sources, items$: sources.engagements$})
  const list = ProfilesFetcher(AppList)(sources)

  const DOM = combineLatestToDiv(mt.DOM, list.DOM)

  return {
    DOM,
    route$: list.route$,
  }
}

const EngagedList = sources => {
  return ViewWithDetail({
    ...sources,
    viewControl: View,
    detailControl: Detail,
  })
}

export default EngagedList
