import {Observable as $} from 'rx'
const {of} = $
import {div} from 'helpers'
import {combineLatestToDiv} from 'util'

import {
  List,
} from 'components/sdm'

import {ViewWithDetail} from 'components/ui'

import Detail from './Detail'
import Item from './Item'

const AppList = sources => List({...sources,
  Control$: of(Item),
  rows$: sources.engagements$,
})

const EmptyNotice = sources => ({
  DOM: sources.items$.map(i =>
    i.length > 0 ? null : div({},['Empty notice'])
  ),
})

const View = sources => {
  const mt = EmptyNotice({...sources, items$: sources.engagements$})
  const list = AppList(sources)

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
