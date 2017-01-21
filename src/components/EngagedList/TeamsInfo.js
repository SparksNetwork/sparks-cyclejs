import {Observable as $} from 'rx'
const {of} = $
import {
  map, prop, of as rof, compose,
} from 'ramda'
import isolate from '@cycle/isolate'
import {combineDOMsToDiv} from 'util'
import {div} from 'cycle-snabbdom'
import {
  List,
  ListItemHeader,
} from 'components/sdm'
import Collapsible from 'components/behaviors/Collapsible'

import AddToTeam from './AddToTeam'
import TeamItem from './TeamItem'

import {Memberships, Teams} from 'components/remote'

const TeamsInfo = sources => {
  const addToTeam = isolate(AddToTeam)(sources)

  const memberships$ = sources.engagement$
    .pluck('$key')
    .flatMapLatest(Memberships.query.byEngagement(sources))
    .shareReplay(1)

  const list = List({...sources,
    Control$: of(TeamItem),
    rows$: memberships$,
  })

  const hasBeenAccepted$ = memberships$
    .map(memberships => memberships.some(x => x.isAccepted === true))

  const rightDOM$ = memberships$.map(map(prop('teamKey')))
    .map(map(Teams.query.one(sources)))
    .flatMapLatest($.combineLatest)
    .map(compose(Boolean, prop('name')))
    .map(compose(div, rof, prop('length')))

  const header = Collapsible(ListItemHeader)({
    ...sources,
    title$: of('Teams'),
    iconName$: of('people'),
    rightDOM$,
    contentDOM$: combineDOMsToDiv('', addToTeam, list),
  })

  return {
    DOM: header.DOM,
    queue$: list.queue$.merge(addToTeam.queue$),
    route$: addToTeam.route$,
    hasBeenAccepted$,
  }
}

export default TeamsInfo
