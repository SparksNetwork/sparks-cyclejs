import {Observable} from 'rx'
const {of, combineLatest} = Observable
import {prop, compose, fromPairs, map} from 'ramda'

import {TabbedPage} from 'components/ui'

import EngagedList from 'components/EngagedList'

const statuses = ['applied', 'ok', 'confirmed', 'never']
const labels = {
  applied: 'Applied',
  ok: 'Approved',
  confirmed: 'Confirmed',
  never: 'Rejected',
}
const paths = {applied: '/'}

const _TabMaker = sources => ({
// <<<<<<< HEAD
//   tabs$: combineLatest(
//     sources.applied$,
//     sources.priority$,
//     sources.ok$,
//     sources.never$,
//     (ap,pr,ok,nv) => [
//       {path: '/', label: `${ap.length} Applied`},
//       pr.length > 0 && {path: '/priority', label: `${pr.length} Priority`},
//       ok.length > 0 && {path: '/ok', label: `${ok.length} Accepted`},
//       nv.length > 0 && {path: '/never', label: `${nv.length} Rejected`},
//     ].filter(x => !!x)
//   ),
// =======
  tabs$: combineLatest(...statuses.map(status =>
    sources[`${status}$`].map(prop('length')).map(count => ({
      path: paths[status] || `/${status}`,
      label: `${count} ${labels[status]}`,
    }))
  )),
// >>>>>>> feature/unified-admin-profiles
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
