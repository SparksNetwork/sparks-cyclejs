import {Observable} from 'rx'
const {of, merge} = Observable
import {prop, objOf} from 'ramda'

import isolate from '@cycle/isolate'

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

const _Fetch = sources => {
  const project$ = sources.projectKey$
    .flatMapLatest(Projects.query.one(sources))
    .shareReplay(1)

  const opps$ = sources.projectKey$
    .flatMapLatest(Opps.query.byProject(sources))
    .map(opps => opps.filter(({isPublic}) => isPublic))
    .shareReplay(1)

  const projectImage$ = sources.projectKey$
    .flatMapLatest(ProjectImages.query.one(sources))
    .shareReplay(1)

  return {
    project$,
    projectImage$,
    opps$,
  }
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
  '/opp/:key': key => _sources =>
    isolate(Opp)({oppKey$: Observable.just(key), ..._sources}),
})})

const Apply = sources => {
  const _sources = {...sources, ..._Fetch(sources)}

  const desc = _Description(_sources)
  const page = _Page(_sources)

  const pageDOM = combineLatestToDiv(desc.DOM, page.DOM)
    .shareReplay(1)
    .tap(sources.prerender.ready)

  const title = _Title({
    ..._sources,
    projectImage$: pageDOM.delay(100).flatMap(() => _sources.projectImage$),
  })

  const frame = SoloFrame({...sources,
    headerDOM: title.DOM,
    pageDOM,
  })

  const openGraph = merge(
    _sources.project$.map(project => ({
      title: project.name,
      description: project.description,
    })),
    _sources.project$.filter(prop('facebookImageUrl'))
      .map(prop('facebookImageUrl'))
      .map(objOf('image'))
  )

  return {
    DOM: frame.DOM,
    ...mergeSinks(frame, page),
    openGraph,
  }
}

export default Apply
