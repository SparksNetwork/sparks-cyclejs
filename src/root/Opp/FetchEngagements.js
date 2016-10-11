import {
  Engagements,
} from 'components/remote'

export const FetchEngagements = component => sources => {
  const engagements$ = sources.oppKey$
    .flatMapLatest(Engagements.query.byOpp(sources))
    .shareReplay(1)

  return component({
    ...sources,
    engagements$,
  })
}
