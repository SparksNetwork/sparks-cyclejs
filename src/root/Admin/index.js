import {Observable} from 'rx'
const {of} = Observable
// import combineLatestObj from 'rx-combine-latest-obj'

import AppFrame from 'components/AppFrame'
import Title from 'components/Title'
import Header from 'components/Header'

import {mergeSinks} from 'util'

import ComingSoon from 'components/ComingSoon'

import Projects from './Projects'
import Profiles from './Profiles'

import {TabbedPage} from 'components/ui'

const _Nav = sources => ({
  DOM: sources.isMobile$.map(m => m ? null : sources.titleDOM),
})

const _Title = sources => Title({...sources,
  labelText$: of('Administration'),
  subLabelText$: of('At a Glance'), // eventually page$.something
})

const _Page = sources => TabbedPage({...sources,
  tabs$: of([
    {path: '/', label: 'Projects'},
    {path: '/profiles', label: 'Profiles'},
    {path: '/previously', label: 'Previously'},
    {path: '/test', label: 'Test'},
  ]),
  routes$: of({
    '/': Projects,
    '/profiles': Profiles,
    '/previously': ComingSoon('Admin/Previously'),
    '/test': ComingSoon('Admin/Test'),
  }),
})

export default sources => {
  const page = _Page(sources)
  const title = _Title({...sources, tabsDOM$: page.tabBarDOM})
  const nav = _Nav({...sources, titleDOM: title.DOM})
  const header = Header({...sources,
    titleDOM: title.DOM,
    tabsDOM: page.tabBarDOM,
  })

  const appFrame = AppFrame({
    navDOM: nav.DOM,
    headerDOM: header.DOM,
    pageDOM: page.DOM,
    ...sources,
  })

  const children = [appFrame, page, title, nav, header]

  return {
    ...mergeSinks(...children),
    DOM: appFrame.DOM,
  }
}
