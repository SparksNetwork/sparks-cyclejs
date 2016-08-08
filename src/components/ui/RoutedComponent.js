import {SwitchedComponent} from 'components/SwitchedComponent'

/**
* Specialized version of SwitchComponent that takes a routes object and
* switches between components based on the route.
*/
export const RoutedComponent = sources => {
  const comp$ = sources.routes$
    .map(routes => sources.router.define(routes))
    .switch()
    .distinctUntilChanged(({path}) => path)
    .filter(({path, value}) => path && value)
    .map(({path, value}) =>
      sources => value({...sources, router: sources.router.path(path)}))
    .shareReplay(1)

  return SwitchedComponent({
    ...sources,
    Component$: comp$,
  })
}
