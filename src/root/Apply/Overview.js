import './styles.scss'

import {Observable} from 'rx'
const {just, combineLatest} = Observable

import {h} from 'cycle-snabbdom'
import {div} from 'helpers'

import {
  List,
  ListItemNavigating,
} from 'components/sdm'

import {TitleListItem} from 'components/ui'

const _Title = sources => TitleListItem({...sources,
  title$: just('Check out these Opportunities!'),
})

function radioButton(sources) {
  const isCurrent$ = combineLatest(
    sources.router.observable, sources.item$.pluck('$key'),
    (route, itemKey) => itemKey === route.pathname.split('/opp/')[1])

  return isCurrent$.map(isCurrent => {
    return h('svg', {
      ns: 'http://www.w3.org/2000/svg',
      attrs: {
        width: '64px',
        height: '64px',
        margin: '0 auto',
      },
    }, [
      h('circle', {
        ns: 'http://www.w3.org/2000/svg',
        style: {
          borderWidth: '3px',
        },
        attrs: {
          cx: '32',
          cy: '32',
          r: '14',
          stroke: '#FFC107',
          'stroke-width': '3',
          fill: 'transparent',
        },
      }, []),

      isCurrent ? h('circle', {
        attrs: {
          cx: '32',
          cy: '32',
          r: '8',
          stroke: 'transparent',
          fill: '#FFC107',
        },
      }, []) : h('div'),
    ])
  })
}

const _Item = sources => ListItemNavigating({...sources,
  title$: sources.item$.pluck('name'),
  subtitle$: sources.item$.pluck('description'),
  leftDOM$: radioButton(sources),
  path$: combineLatest(sources.router.observable, sources.item$.pluck('$key'),
    (location, itemKey) => {
      return location.pathname.split('/opp/')[0] + '/opp/' + itemKey
    }),
})

const _List = sources => List({...sources,
  rows$: sources.opps$,
  Control$: just(_Item),
})

export default sources => {
  const t = _Title(sources)
  const l = _List(sources)
  const childs = [t, l]

  return {
    DOM: combineLatest(childs.map(c => c.DOM),
      (...doms) => div({style: {marginTop: '2em'}},doms)),
    route$: l.route$.share(),
  }
}
