import {pluckLatest, pluckLatestOrNever} from 'util'

const sinks = [
  'auth$',
  'queue$',
  'route$',
  'focus$',
  'openAndPrint',
  'openGraph',
]

export const SwitchedComponent = sources => {
  const comp$ = sources.Component$
    .distinctUntilChanged()
    .map(C => C(sources))
    .shareReplay(1)

  return {
    pluck: key => pluckLatestOrNever(key, comp$),
    DOM: pluckLatest('DOM', comp$),
    ...sinks.reduce((a,k) =>
      (a[k] = pluckLatestOrNever(k,comp$)) && a, {}
    ),
  }
}
