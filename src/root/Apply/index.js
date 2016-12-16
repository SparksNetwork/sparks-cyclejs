import {Observable} from 'rx'
const {of, merge} = Observable
import {prop, objOf} from 'ramda'

import isolate from '@cycle/isolate'
import {div} from 'cycle-snabbdom'

import SoloFrame from 'components/SoloFrame'
import {ResponsiveTitle} from 'components/Title'
import {Share} from 'components/ui/Facebook'

import Opp from './Opp'
import Overview from './Overview'

import {
  DescriptionListItem,
  RoutedComponent,
} from 'components/ui'

import {
  Opps,
  ProjectImages,
  Projects,
} from 'components/remote'

// import {log} from 'util'
import {combineLatestToDiv, mergeSinks} from 'util'

const Fetch = component => sources => {
  const project$ = sources.projectKey$
    .flatMapLatest(Projects.query.one(sources))
    .shareReplay(1)

  const opps$ = sources.projectKey$
    .flatMapLatest(Opps.query.byProject(sources))

  const projectImage$ = sources.projectKey$
    .flatMapLatest(ProjectImages.query.one(sources))
    .shareReplay(1)

  return component({
    ...sources,
    project$,
    projectImage$,
    opps$,
  })
}

const _Title = sources => ResponsiveTitle({...sources,
  titleDOM$: sources.project$.pluck('name'),
  subtitleDOM$: sources.opps$.map(o => o.length + ' Opportunities Available'),
  backgroundUrl$: sources.projectImage$
    .map(pi => pi && pi.dataUrl)
    .startWith(null),
})

const _Description = sources => DescriptionListItem({...sources,
  title$: sources.project$.pluck('description'),
  rightDOM$: Share({
    ...sources,
  }).DOM,
})

const _Page = sources => RoutedComponent({...sources, routes$: of({
  '/': Overview,
  '/private/:privateKey': key => _sources => isolate(Overview)({privateKey$: Observable.just(key), ..._sources}),
  '/private/:privateKey/opp/:oppKey': (privateKey, oppKey) => _sources =>
      isolate(Opp)({..._sources, privateKey$: Observable.just(privateKey), oppKey$: Observable.just(oppKey)}),
  '/opp/:key': key => _sources =>
    isolate(Opp)({oppKey$: Observable.just(key), privateKey$: Observable.just(null), ..._sources}),
})})

const Apply = sources => {
  const desc = _Description(sources)
  const page = _Page(sources)

  const pageDOM = combineLatestToDiv(desc.DOM
      .map(view => div({style: {marginTop: '2em'}}, [view])), page.DOM)
    .shareReplay(1)
    .tap(sources.prerender.ready)

  const title = _Title({
    ...sources,
    projectImage$: pageDOM.delay(100).flatMap(() => sources.projectImage$),
  })

  const frame = SoloFrame({...sources,
    headerDOM: title.DOM,
    pageDOM,
  })

  const openGraph = merge(
    sources.project$.map(project => ({
      title: project.name,
      description: project.description,
    })),
    sources.project$.filter(prop('facebookImageUrl'))
      .map(prop('facebookImageUrl'))
      .map(objOf('image'))
  )

  return {
    DOM: frame.DOM,
    ...mergeSinks(frame, page),
    openGraph,
  }
}

export default Fetch(Apply)
