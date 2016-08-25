import {Observable as $} from 'rx'
const {of} = $
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

const ViewAndDetail = (sources, options) => {
  const view = sources.viewControl(sources)
  const detail = sources.detailControl(sources)
  const [viewCol, detailCol] = options.cols || [6, 6]

  const DOM = $.combineLatest(
    view.DOM,
    detail.DOM,
  )
  .map(([view, detail]) =>
    div('.row', [
      div(`.col-md-${viewCol}.hidden-sm-down`, [view]),
      div(`.col-md-${detailCol}.col-xs-12`, [detail]),
    ])
  )
  .shareReplay(1)

  return {
    ...mergeSinks(view, detail),
    DOM,
  }
}

const ViewWithDetail = (sources, options = {}) => {
  const createHref = sources.router.createHref

  return RoutedComponent({
    ...sources,
    createHref,
    routes$: of({
      '/': sources => ViewOnly(sources, options),
      '/show/:key': key => sources =>
        ViewAndDetail({...sources, key$: of(key)}, options),
    }),
  })
}

export {ViewWithDetail}
