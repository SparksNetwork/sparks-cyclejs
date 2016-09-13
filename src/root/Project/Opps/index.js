import {Observable} from 'rx'
const {of, just} = Observable

import {TabbedPage} from 'components/ui'
import {mergeSinks} from 'util'

import {div} from 'cycle-snabbdom'
import {KeyRoute} from 'helpers/auth'
import {nestedComponent} from 'util'

import {
  ListItem,
} from 'components/sdm'

import {
  TitleListItem,
} from 'components/ui'

import All from './All'
import View from './View'

// const View = sources => {
//   return {
//     pageTitle: just('View'),
//     tabBarDOM: just(div({},[''])),
//     DOM: just(div({},['view content'])),
//     ...mergeSinks(),
//   }
// }

export default sources => {
  const page$ = nestedComponent(
    sources.router.define({
      '/': All,
      '/view/:key': KeyRoute(View, 'oppKey$'),
      // '/view/:key': k => View({...sources, oppKey$: just(k)}),
    }),
    sources
  )

  return {
    pageTitle: page$.flatMapLatest(p => p.pageTitle),
    tabBarDOM: page$.pluck('tabBarDOM'),
    DOM: page$.pluck('DOM'),
    ...mergeSinks(page$),
    // route$: page$.pluck('route$'),
  }
}

// export default sources => ({
//   pageTitle: of('Manage Live'),
//   tabBarDOM: just(['tabs']),
//   ...All(sources),

//   // ...TabbedPage({...sources,
//   //   tabs$: of([
//   //     {path: '/', label: 'Arrivals'},
//   //     {path: '/checkin', label: 'Shift Checkin'},
//   //   ]),
//   //   routes$: of({
//   //     '/': All,
//   //     '/checkin': View,
//   //   }),
//   // }),
// })


// export default sources => ({
//   pageTitle: of('Manage Live'),

//   ...TabbedPage({...sources,
//     tabs$: of([
//       {path: '/', label: 'Arrivals'},
//       {path: '/checkin', label: 'Shift Checkin'},
//     ]),
//     routes$: of({
//       '/': All,
//       '/checkin': View,
//     }),
//   }),
// })
