import {Observable as $} from 'rx'
const {combineLatest} = $
import {map, prop, flatten} from 'ramda'
import {Engagements} from 'components/remote'

/**
 * Fetch the engagements of all opps in sources.opps$
 * @param component
 * @constructor
 */
export const FetchEngagements = component => sources => {
  const engagements$ = sources.opps$.map(map(prop('$key')))
    .map(map(Engagements.query.byOpp(sources)))
    .flatMapLatest(queries => combineLatest(...queries))
    .map(flatten)
    .shareReplay(1)

  return component({
    ...sources,
    engagements$,
  })
}
