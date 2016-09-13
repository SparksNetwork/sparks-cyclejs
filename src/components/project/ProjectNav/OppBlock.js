import {Observable} from 'rx'
const {just, merge, never, combineLatest} = Observable

import {OppItemNavigating} from 'components/opp'
import {QuickNav} from 'components/QuickNav'
import {div} from 'cycle-snabbdom'
import {KeyRoute} from 'helpers/auth'
import {
  List,
  ListItem,
  ListItemCollapsible,
  ListItemNavigating,
} from 'components/sdm'

import isolate from '@cycle/isolate'

const OPPREGEX = /(opp)\/(.+?)\//

const _AllOpps = sources => ListItemNavigating({...sources,
  title$: just('All Opportunities'),
  path$: just(sources.router.createHref(`/opps`)),
})

const _OppNav = sources => OppItemNavigating({...sources,
  path$: sources.item$.pluck('$key').map(k => sources.router.createHref(`/opps/view/${k}`)),
  // path$: just(sources.router.createHref(`/opps/${}`)),
  // path$: sources.item$.combineLatest(
  //   sources.router.observable.pluck('pathname'),
  //   ({$key},path) => path.match(OPPREGEX) ?
  //     path.replace(OPPREGEX, `opp/${$key}/`) :
  //     `/opp/${$key}`
  // ),
})

const OppDropdownNavigator = sources => {
  const all = isolate(_AllOpps)(sources)
  const opps = isolate(List,'opps')({...sources,
    Control$: just(_OppNav),
    rows$: sources.opps$,
  })
  const nav = QuickNav({...sources,
    label$: just('Opportunities'),
    menuItems$: just([all.DOM, opps.DOM]),
    isOpen$: merge(all.route$, opps.route$).map(false),
  })
  const route$ = merge(opps.route$, all.route$)
  return {
    ...nav,
    route$,
  }
}

import {nestedComponent} from 'util'

const None = sources => ({
  DOM: just(div({})),
})

const View = sources => ({
  DOM: just(div({},['selected'])),
})
const OppBlock = sources => {
  const dd = OppDropdownNavigator(sources)
  const li = ListItem({...sources,
    title$: dd.DOM,
    iconName$: just('power'),
  })
  const detail$ = nestedComponent(
    sources.router.define({
      '/': None,
      '/opps/view/:key': KeyRoute(View, 'oppKey$'),
      // '/view/:key': k => View({...sources, oppKey$: just(k)}),
    }),
    sources
  )
  const DOM = combineLatest(li.DOM, detail$.flatMapLatest(d => d.DOM), (...doms) => div({}, doms))
  return {
    ...li,
    // DOM,
    route$: dd.route$,
  }
}

export default OppBlock
