import {Observable} from 'rx'
const {of, just, never, combineLatest} = Observable
import {mergeSinks} from 'util'
import {find, propEq, filter} from 'ramda'

import {div} from 'cycle-snabbdom'


import {TabbedPage} from 'components/ui'

import {
  TitleListItem,
} from 'components/ui'

// export default sources => {
//   const title = TitleListItem({...sources,
//     title$: just('All Opportunities'),
//   })

//   return {
//     pageTitle: just('All Opportunities'),
//     tabBarDOM: just(div({},[''])),
//     DOM: just(div({},[title.DOM])),
//     ...mergeSinks(),
//   }
// }

const Overview = sources => {
  return {
    DOM: just(div({},['View Overview'])),
    route$: never(),
  }
}

import EngagedList from 'components/EngagedList'

const Applied = sources => {
  return {
    DOM: sources.engagements$.map(e => div({},[`${e.length} engagements`])),
    // DOM: just(div({},['View Applied'])),
  }
}

const Page = sources => ({
  pageTitle: sources.opp$.pluck('name'),
  ...TabbedPage({...sources,
    tabs$: of([
      {path: '/', label: 'Overview'},
      {path: '/applied', label: 'Applied'},
      {path: '/approved', label: 'Approved'},
      {path: '/confirmed', label: 'Confirmed'},
      {path: '/incomplete', label: 'Incomplete'},
      {path: '/rejected', label: 'Rejected'},
    ]),
    routes$: of({
      '/': Overview,
      '/applied': Applied,
      '/approved': Applied,
      '/confirmed': Applied,
      '/incomplete': Applied,
      '/rejected': Applied,
    }),
  }),
})

export default sources => {
  sources.oppKey$.subscribe(k => console.log('new oppkey',k))
  const opp$ = combineLatest(
    sources.opps$, sources.oppKey$,
    (opps,key) => find(propEq('$key',key))(opps)
  )

  const engagements$ = combineLatest(
    sources.oppKey$, sources.engagements$,
    (ok,e) => filter(propEq('oppKey',ok))(e)
  ).tap(e => console.log('e count', e.length))

  return Page({...sources,
    opp$,
    engagements$,
  })
}
