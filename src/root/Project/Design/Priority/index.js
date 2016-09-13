import {Observable} from 'rx'
const {just, combineLatest} = Observable

import Setup from './Setup'
import Ready from './Ready'

import {
  CardContainer,
} from 'components/sdm'

import {hideable} from 'util'

const isMissing = prop => prop ? false : true

const Needs = sources => {
  const needsDescription$ = sources.project$.pluck('description').map(isMissing)
  const needsPicture$ = sources.projectImage$.pluck('dataUrl').map(isMissing)
  const needsTeam$ = sources.teams$.map(ts => ts.length > 0 ? false : true)
  const needsOpp$ = sources.opps$.map(os => os.length > 0 ? false : true)
  const needsOrganizers$ = sources.organizers$.map(os => os.length > 0 ? false : true)

  const needsSetup$ = combineLatest(
    needsDescription$, needsPicture$, needsTeam$, needsOpp$, needsOrganizers$,
    (...needs) => needs.reduce((a,x) => a || x, false)
  )
  // const needsSetup$ = just(false)

  return {
    needsDescription$,
    needsPicture$,
    needsTeam$,
    needsOpp$,
    needsOrganizers$,
    needsSetup$,
  }
}

export default _sources => {
  const sources = {..._sources, ...Needs(_sources)}

  const setup = hideable(Setup)({...sources,
    isVisible$: sources.needsSetup$,
  })
  const ready = hideable(Ready)({...sources,
    isVisible$: sources.needsSetup$.map(n => !n),
  })

  const container = CardContainer({...sources,
    content$: just([setup.DOM, ready.DOM]),
  })

  return {
    ...container,
    route$: setup.route$,
  }
}
