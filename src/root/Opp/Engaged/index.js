import {Observable} from 'rx'
const {of, combineLatest} = Observable

import {TabbedPage} from 'components/ui'

import EngagedList from 'components/EngagedList'

const _TabMaker = sources => ({
  tabs$: combineLatest(
    sources.applied$,
    sources.priority$,
    sources.ok$,
    sources.never$,
    (ap,pr,ok,nv) => [
      {path: '/', label: `${ap.length} Applied`},
      pr.length > 0 && {path: '/priority', label: `${pr.length} Priority`},
      ok.length > 0 && {path: '/ok', label: `${ok.length} Accepted`},
      nv.length > 0 && {path: '/never', label: `${nv.length} Rejected`},
    ].filter(x => !!x)
  ),
})

const Applied = sources => EngagedList({...sources,
  engagements$: sources.applied$,
})
const Priority = sources => EngagedList({...sources,
  engagements$: sources.priority$,
})
const OK = sources => EngagedList({...sources,
  engagements$: sources.ok$,
})
const Never = sources => EngagedList({...sources,
  engagements$: sources.never$,
})

export default sources => {
  const _sources = sources

  return {
    pageTitle: of('Engaged Volunteers'),

    ...TabbedPage({..._sources,
      tabs$: _TabMaker(_sources).tabs$,
      routes$: of({
        '/': Applied,
        '/priority': Priority,
        '/ok': OK,
        '/never': Never,
      }),
    }),
  }
}
