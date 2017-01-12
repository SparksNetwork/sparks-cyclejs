import AppFrame from 'components/AppFrame'
import CSV from './CSV'
import ComingSoon from 'components/ComingSoon'
import Header from 'components/Header'
import {Observable} from 'rx'
import Profiles from './Profiles'
import Projects from './Projects'
import {TabbedPage} from 'components/ui'
import Title from 'components/Title'
import {mergeSinks} from 'util'
const {of} = Observable
// import combineLatestObj from 'rx-combine-latest-obj'

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
    {path: '/csv', label: 'CSV'},
  ]),
  routes$: of({
    '/': Projects,
    '/profiles': Profiles,
    '/previously': ComingSoon('Admin/Previously'),
    '/csv': CSV,
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
