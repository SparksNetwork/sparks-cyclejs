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

/**
* @param {Stream<router>} sources.router
* @param {string} options.name
* @param {Array<number, number>} options.cols the screen split, should be 2
*   numbers that add up to 12.
*/
const ViewWithDetail = (sources, options = {}) => {
  const createHref = sources.router.createHref
  const name = options.name || 'show'
  const path = `/${name}/:key`

  createHref.list = () => createHref('')
  createHref.item = key => createHref(`/${name}/${key}`)

  const routes = {'/': sources => ViewOnly(sources, options)}
  routes[path] = key => sources =>
    ViewAndDetail({...sources, key$: of(key)}, options)

  return RoutedComponent({
    ...sources,
    createHref,
    routes$: of(routes),
  })
}

export {ViewWithDetail}
