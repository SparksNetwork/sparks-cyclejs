import {Observable as $} from 'rx'
const {of, merge} = $
import {div} from 'cycle-snabbdom'
import {mergeSinks} from 'util'
import {RoutedComponent} from 'components/ui'

const ViewOnly = sources => {
  const view = sources.viewControl(sources)

  const DOM = view.DOM.map(view =>
    div('.row', [div('.col-xs-12', [view])])
  )

  return {
    ...view,
    DOM,
  }
}

const ViewAndDetail = sources => {
  const view = sources.viewControl(sources)
  const detail = sources.detailControl(sources)

  const DOM = $.combineLatest(
    view.DOM, detail.DOM
  )
  .map(([view, detail]) =>
    div('.row', [
      div('.col-md-6.hidden-sm-down', [view]),
      div('.col-md-6.col-xs-12', [detail]),
    ])
  )

  return {
    ...mergeSinks(view, detail),
    DOM,
    route$: merge(view.route$, detail.route$.map(sources.createHref)),
  }
}

const ViewWithDetail = sources => {
  const createHref = sources.router.createHref

  return RoutedComponent({
    ...sources,
    createHref,
    routes$: of({
      '/': ViewOnly,
      '/show/:key': key => sources =>
        ViewAndDetail({...sources, key$: of(key)}),
    }),
  })
}

export {ViewWithDetail}
