/**
 * This component displays a loader while it creates an engagement for the
 * current profile and the given opp. Once created it will redirect to the
 * engagement.
 */
import {Observable as $} from 'rx'
const {combineLatest, just, never, empty} = $
import {find, prop, propEq, all} from 'ramda'
import {Engagements, Opps} from 'components/remote'
import CenterFrame from 'components/CenterFrame'
import Loader from 'components/ui/Loader'
import {switchStream} from 'util'
import { traceSource } from "../trace"

const Fetch = component => sources => {
  const oppKey$ = sources.oppKey$
  const profileKey$ = sources.userProfileKey$

  const opp$ = oppKey$.flatMapLatest(Opps.query.one(sources))

  const projectKey$ = opp$.map(prop('projectKey'))

  const userEngagments$ = profileKey$
    .flatMapLatest(Engagements.query.byUser(sources))

  const priorEngagment$ = switchStream(sources.auth$, Boolean,
    () => combineLatest(
      userEngagments$,
      oppKey$,
      (engs, oppKey) => find(propEq('oppKey', oppKey))(engs)),
    () => just(null),
  )

  return component({
    ...sources,
    opp$,
    projectKey$,
    priorEngagment$,
  })
}

const ApplyToOpp = sources => {
  const oppKey$ = sources.oppKey$
  const profileKey$ = sources.userProfileKey$
  const priorEngagment$ = sources.priorEngagment$

  const sinks$ = priorEngagment$.map(eng => {
    if (eng) {
      return {
        route$: just(`/engaged/${eng.$key}/application/question`),
        queue$: never(),
      }
    } else {
      const application$ = combineLatest(oppKey$, profileKey$)
        .filter(all(Boolean))
        .map(([oppKey, profileKey]) => ({oppKey, profileKey}))
        .shareReplay(1)

      const queue$ = application$
        .map(Engagements.action.create)

      return {
        route$: never(),
        queue$,
      }
    }
  })
  .shareReplay(1)

  const frame = CenterFrame({
    ...sources,
    pageDOM: Loader(sources).DOM,
  })

  return {
    DOM: frame.DOM,
    queue$: sinks$.flatMapLatest(prop('queue$')),
    route$: sinks$.flatMapLatest(prop('route$')),
  }
}

export default Fetch(ApplyToOpp)
