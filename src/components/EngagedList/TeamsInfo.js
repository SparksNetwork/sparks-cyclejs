import {Observable as $} from 'rx'
const {of} = $
import {
  prop, of as rof, compose,
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

const TeamsInfo = sources => {
  const addToTeam = isolate(AddToTeam)(sources)
  const list = List({...sources,
    Control$: of(TeamItem),
    rows$: sources.memberships$,
  })

  const hasBeenAccepted$ = sources.memberships$
    .map(memberships => memberships.some(x => x.isAccepted === true))

  const header = Collapsible(ListItemHeader)({
    ...sources,
    title$: of('Applied to Teams'),
    iconName$: of('people'),
    rightDOM$: sources.memberships$.map(compose(div, rof, prop('length'))),
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
