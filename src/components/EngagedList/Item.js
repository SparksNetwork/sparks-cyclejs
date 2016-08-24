import {Observable as $} from 'rx'
const {of, combineLatest} = $
import {
  prop, compose, sum, reject, map, equals, objOf,
} from 'ramda'

import {
  ListItemNavigating,
} from 'components/sdm'

import {EngagementFetcher} from './fetch'

import {cellC, icon} from 'helpers/layout'

const EngagementAssignmentCount = sources => ({
  DOM: combineLatest(
    sources.shifts$.map(prop('length')),
    sources.commitments$.map(
      compose(
        sum,
        reject(isNaN),
        map(Number),
        map(prop('count'))
      )
    )
  )
  .map(([shifts, commitments]) =>
    cellC(
      {accent: shifts !== commitments},
      `${shifts}/${commitments}`,
      icon('insert_invitation')
    )
  ),
})

const Item = sources => {
  const eac = EngagementAssignmentCount(sources)

  const li = ListItemNavigating({...sources,
    title$: sources.profile$.map(prop('fullName')),
    iconSrc$: sources.profile$.map(prop('portraitUrl')),
    rightDOM$: eac.DOM,
    path$: sources.item$.map(({$key}) =>
      sources.createHref(`/show/${$key}`)),
    classes$: $.combineLatest(
      sources.item$.map(prop('$key')),
      sources.key$ || of(false),
      equals
    )
    .map(objOf('yellow')),
  })

  return li
}

export default EngagementFetcher(Item)
