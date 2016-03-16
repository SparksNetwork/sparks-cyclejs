import {Observable} from 'rx'

import {div} from 'cycle-snabbdom'

import AppFrame from 'components/AppFrame'
import Title from 'components/Title'
import Header from 'components/Header'
import TabBar from 'components/TabBar'

import {nestedComponent, mergeOrFlatMapLatest} from 'util'

import ComingSoon from 'components/ComingSoon'

// import Doing from './Doing'

const _routes = {
  '/': ComingSoon('Dash/Priority'),
  '/application': ComingSoon('Dash/Application'),
  '/commitments': ComingSoon('Dash/Commitments'),
}

const _tabs = [
  {path: '/', label: 'Priority'},
  {path: '/application', label: 'Application'},
  {path: '/commitments', label: 'Commitments'},
]

const Nav = sources => ({
  DOM: sources.isMobile$
    .map(isMobile =>
      div(
        {},
        [isMobile ? null : sources.titleDOM, '']
      )
    ),
})

export default sources => {
  const page$ = nestedComponent(sources.router.define(_routes),sources)

  const tabBar = TabBar({...sources, tabs: Observable.just(_tabs)})

  const title = Title({
    tabsDOM$: tabBar.DOM,
    labelText$: sources.userProfile$.map(up => up && up.fullName || 'None'),
    subLabelText$: Observable.just(''),
    ...sources,
  })

  const nav = Nav({titleDOM: title.DOM, ...sources})

  const header = Header({titleDOM: title.DOM, tabsDOM: tabBar.DOM, ...sources})

  const appFrame = AppFrame({
    navDOM: nav.DOM,
    headerDOM: header.DOM,
    pageDOM: page$.pluck('DOM'),
    ...sources,
  })

  const children = [appFrame, page$, tabBar, title, nav, header]

  const route$ = Observable.merge(
    mergeOrFlatMapLatest('route$', ...children),
    sources.redirectLogout$,
  )

  return {
    DOM: appFrame.DOM,
    auth$: mergeOrFlatMapLatest('auth$', ...children),
    queue$: mergeOrFlatMapLatest('queue$', ...children),
    route$,
  }
}

