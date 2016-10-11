import {Observable} from 'rx'
const {of, combineLatest} = Observable
import {prop, compose, fromPairs, map} from 'ramda'

import {TabbedPage} from 'components/ui'
import EngagedList from 'components/EngagedList'
import {FetchEngagements} from './fetch'
import {EngagementStatus} from 'helpers/EngagementStatus'

const statuses = ['applied', 'ok', 'confirmed', 'never', 'incomplete', 'engagements']
const labels = {
  applied: 'Applied',
  ok: 'Approved',
  confirmed: 'Confirmed',
  never: 'Rejected',
  incomplete: 'Incomplete',
  engagements: 'All',
}
const paths = {applied: '/'}

const _TabMaker = sources => ({
  tabs$: combineLatest(...statuses.map(status =>
    sources[`${status}$`].map(prop('length')).map(count => ({
      path: paths[status] || `/${status}`,
      label: `${count} ${labels[status]}`,
    }))
  )),
})

const StatusList = status => sources => EngagedList({...sources,
  engagements$: sources[`${status}$`],
})

const makeRoutes = compose(
  fromPairs,
  map(status => [paths[status] || `/${status}`, StatusList(status)])
)

export default FetchEngagements(EngagementStatus(sources => {
  return {
    pageTitle: of('Engaged Volunteers'),

    ...TabbedPage({...sources,
      tabs$: _TabMaker(sources).tabs$,
      routes$: of(makeRoutes(statuses)),
    }),
  }
}))
