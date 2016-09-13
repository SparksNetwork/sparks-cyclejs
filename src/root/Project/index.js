import {Observable} from 'rx'
const {combineLatest, just} = Observable

import {flatten} from 'ramda'

import AppFrame from 'components/AppFrame'
import Header from 'components/Header'
import {ProjectNav} from 'components/project'
// import ComingSoon from 'components/ComingSoon'

import {ResponsiveTitle} from 'components/Title'

import {nestedComponent, mergeOrFlatMapLatest} from 'util'

import Design from './Design'
import Manage from './Manage'
import ProjectOpps from './Opps'

const _routes = {
  // isolating breaks child tab navigation?
  '/': Design,
  '/manage': Manage,
  '/teams': Manage,
  '/opps': ProjectOpps,
}

import {
  Projects,
  ProjectImages,
  Teams,
  Opps,
  Organizers,
  Arrivals,
  Engagements,
} from 'components/remote'

const Fetch = sources => {
  const projectKey$ = sources.projectKey$

  const project$ = sources.projectKey$
    .flatMapLatest(Projects.query.one(sources))

  const projectImage$ = sources.projectKey$
    .flatMapLatest(ProjectImages.query.one(sources))

  const teams$ = sources.projectKey$
    .flatMapLatest(Teams.query.byProject(sources))

  const opps$ = projectKey$
    .flatMapLatest(Opps.query.byProject(sources))
    .tap(o => console.log('opps',o))

  const engagements$ = opps$
    .flatMapLatest(opps =>
      opps.length > 0 ?
      combineLatest(
        ...opps.map(o => Engagements.query.byOpp(sources)(o.$key)),
        (...opps) => flatten(opps),
      ) :
      just([])
    )

  const organizers$ = sources.projectKey$
    .flatMapLatest(Organizers.query.byProject(sources))

  const arrivals$ = sources.projectKey$
    .flatMapLatest(Arrivals.query.byProject(sources))

  return {
    projectKey$,
    project$,
    projectImage$,
    teams$,
    opps$,
    organizers$,
    arrivals$,
    engagements$,
  }
}

export default _sources => {
  const sources = {..._sources, ...Fetch(_sources)}

  const page$ = nestedComponent(
    _sources.router.define(_routes),
    sources
  )

  const tabsDOM = page$.flatMapLatest(page => page.tabBarDOM)

  // const subtitleDOM$ = combineLatest(
  //   sources.isMobile$,
  //   page$.flatMapLatest(page => page.pageTitle),
  //   (isMobile, pageTitle) => isMobile ? pageTitle : null,
  // )

  const subtitleDOM$ = page$.flatMapLatest(p => p.pageTitle)

  const title = ResponsiveTitle({...sources,
    tabsDOM$: tabsDOM,
    titleDOM$: sources.project$.pluck('name'),
    subtitleDOM$,
    backgroundUrl$: sources.projectImage$.map(i => i && i.dataUrl),
  })

  const nav = ProjectNav({...sources,
    titleDOM: title.DOM,
  })

  const header = Header({titleDOM: title.DOM, tabsDOM, ...sources})

  const appFrame = AppFrame({
    // navDOM: sources.navDOM$,
    navDOM: nav.DOM,
    headerDOM: header.DOM,
    pageDOM: page$.pluck('DOM'),
    ...sources,
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
    focus$: mergeOrFlatMapLatest('focus$', ...children),
    route$,
  }
}
