import {Observable as $} from 'rx'
import {prop} from 'ramda'

import {FetchEngagements} from '../FetchEngagements'

import {TabBar} from 'components/TabBar'

import EngagedList from 'components/EngagedList'

const Confirmed = sources => {
  const list = EngagedList({
    ...sources,
    engagements$: sources.confirmed$,
  })

  const tabBar = TabBar({
    ...sources,
    tabs$: sources.confirmed$
      .map(prop('length'))
      .map(l => [{path: '/', label: `${l} Confirmed`}]),
  })

  return {
    ...list,
    pageTitle: $.of('Confirmed Volunteers'),
    tabBarDOM: tabBar.DOM,
    queue$: list.queue$,
  }
}

export default FetchEngagements(Confirmed)
