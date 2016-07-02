import {Observable} from 'rx'
const {empty} = Observable
import {div} from 'helpers'
// import {log} from 'util'

const pluckLatest = (k,s$) => s$.pluck(k).switch()

const pluckLatestOrNever = (k,s$) =>
  s$.map(c => c[k] || empty()).switch()

const sinks = [
  'auth$',
  'queue$',
  'route$',
  'focus$',
  'openAndPrint',
  'openGraph',
]

export const RoutedComponent = sources => {
  const comp$ = sources.routes$
    .map(routes => sources.router.define(routes))
    .switch()
    .distinctUntilChanged(({path}) => path)
    .map(({path, value}) => {
      const c = value({...sources, router: sources.router.path(path)})
      return {
        ...c,
        DOM: c.DOM && c.DOM.startWith(div('.loading',['Loading...'])),
      }
    })
    .shareReplay(1)

  return {
    pluck: key => pluckLatestOrNever(key, comp$),
    DOM: pluckLatest('DOM', comp$),
    ...sinks.reduce((a,k) =>
      (a[k] = pluckLatestOrNever(k,comp$)) && a, {}
    ),
  }
}
