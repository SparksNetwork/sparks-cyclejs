import {Observable} from 'rx'
const {of, combineLatest} = Observable
import {prop, compose, fromPairs, map} from 'ramda'

import {TabbedPage} from 'components/ui'

import EngagedList from 'components/EngagedList'

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

export default sources => {
  const _sources = sources

  return {
    pageTitle: of('Engaged Volunteers'),

    ...TabbedPage({..._sources,
      tabs$: _TabMaker(_sources).tabs$,
      routes$: of(makeRoutes(statuses)),
    }),
  }
}
