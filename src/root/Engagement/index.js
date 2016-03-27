import {Observable} from 'rx'
// import combineLatestObj from 'rx-combine-latest-obj'
// import isolate from '@cycle/isolate'

import {div} from 'cycle-snabbdom'

import AppFrame from 'components/AppFrame'
import Title from 'components/Title'
import Header from 'components/Header'
import {EngagementNav} from 'components/engagement'

import {nestedComponent, mergeOrFlatMapLatest} from 'util'

// import {log} from 'util'

import Glance from './Glance'
import Application from './Application'
import Schedule from './Schedule'

const _routes = {
  '/': Glance,
  '/application': Application,
  '/schedule': Schedule,
}

// import ProjectQuickNavMenu from 'components/ProjectQuickNavMenu'

export default sources => {
  const engagement$ = sources.engagementKey$
    .flatMapLatest(key => sources.firebase('Engagements',key))

  // const oppKey$ = engagement$.pluck('oppKey')
  const opp$ = engagement$.pluck('opp')

  const projectKey$ = opp$.pluck('projectKey')
  const project$ = opp$.pluck('project')

  const projectImage$ = projectKey$
    .flatMapLatest(projectKey => sources.firebase('ProjectImages',projectKey))

  const page$ = nestedComponent(
    sources.router.define(_routes),
    {engagement$, opp$, projectKey$, project$, ...sources}
  )

  const tabsDOM = page$.flatMapLatest(page => page.tabBarDOM)

  // const quickNav = ProjectQuickNavMenu(
  //   {...sources, engagement$, project$, projectKey$, opp$}
  // )

  const labelText$ = opp$.pluck('name')
  const subLabelText$ = page$.flatMapLatest(page => page.pageTitle)

  const title = Title({...sources,
    quickNavDOM$: project$.pluck('name').map(name => div({},[name])),
    tabsDOM$: tabsDOM,
    labelText$,
    subLabelText$,
    backgroundUrl$: projectImage$.map(pi => pi && pi.dataUrl),
  })

  const nav = EngagementNav({...sources,
    titleDOM: title.DOM,
    engagement$,
  })

  const header = Header({...sources,
    titleDOM: title.DOM,
    tabsDOM: tabsDOM,
  })

  const appFrame = AppFrame({...sources,
    navDOM: nav.DOM,
    headerDOM: header.DOM,
    pageDOM: page$.pluck('DOM'),
  })

  const children = [appFrame, page$, title, nav, header]

  const redirectOnLogout$ = sources.auth$.filter(auth => !auth).map(() => '/')

  const route$ = Observable.merge(
    mergeOrFlatMapLatest('route$', ...children),
    redirectOnLogout$,
  )

  return {
    DOM: appFrame.DOM,
    auth$: mergeOrFlatMapLatest('auth$', ...children),
    queue$: mergeOrFlatMapLatest('queue$', ...children),
    route$,
  }
}