import {Observable as $} from 'rx'
const {of, merge} = $
import {
  equals, objOf, prop,
} from 'ramda'
import {div} from 'helpers'
import './styles.scss'

import {combineLatestToDiv} from 'util'

import {
  Profiles,
} from 'components/remote'

import {
  List,
  ListItemNavigating,
} from 'components/sdm'

import {RoutedComponent} from 'components/ui'

import Detail from './Detail'

const Item = sources => {
  const profile$ = sources.item$
    .pluck('profileKey')
    .flatMapLatest(Profiles.query.one(sources))
    .shareReplay(1)

  return ListItemNavigating({...sources,
    title$: profile$.pluck('fullName'),
    iconSrc$: profile$.pluck('portraitUrl'),
    path$: sources.item$.map(({$key}) =>
      sources.createHref(`/show/${$key}`)
    ),
    classes$: $.combineLatest(
      sources.item$.map(prop('$key')),
      sources.engagementKey$ || of(false),
      equals
    )
    .map(objOf('yellow')),
  })
}

const AppList = sources => List({...sources,
  Control$: of(Item),
  rows$: sources.engagements$,
})

const EmptyNotice = sources => ({
  DOM: sources.items$.map(i =>
    i.length > 0 ? null : div({},['Empty notice'])
  ),
})

const View = sources => {
  const mt = EmptyNotice({...sources, items$: sources.engagements$})
  const list = AppList(sources)

  const DOM = combineLatestToDiv(mt.DOM, list.DOM)

  return {
    DOM,
    route$: list.route$,
  }
}

const ViewOnly = sources => {
  const view = View(sources)
  const DOM = view.DOM.map(view =>
    div('.row', [div('.col-xs-12', [view])])
  )

  return {
    ...view,
    DOM,
  }
}

const ViewWithDetail = sources => {
  const view = View(sources)
  const detail = Detail(sources)

  const DOM = $.combineLatest(
    view.DOM, detail.DOM
  )
  .map(([view, detail]) =>
    div('.row', [
      div('.col-md-6.hidden-sm-down', [view]),
      div('.col-md-6.col-xs-12', [detail]),
    ])
  )

  detail.queue$.subscribe(
    x => console.log(x))

  return {
    DOM,
    route$: merge(view.route$, detail.route$.map(sources.createHref)),
    queue$: detail.queue$,
  }
}

const FilteredView = sources => {
  const createHref = sources.router.createHref

  return RoutedComponent({
    ...sources,
    createHref,
    routes$: of({
      '/': ViewOnly,
      '/show/:key': key => sources =>
        ViewWithDetail({...sources, engagementKey$: of(key)}),
    }),
  })

  //return {
  //  DOM: combineLatestToDiv(mt.DOM, list.DOM, detail.DOM),
  //  route$: merge(list.route$, detail.route$.map(sources.router.createHref)),
  //  queue$: detail.queue$,
  //}
}

export {FilteredView}
