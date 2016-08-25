import {Observable as $} from 'rx'
const {of} = $
import {
  List,
  ListItemWithMenu,
} from 'components/sdm'
import AddTeamItem from './AddTeamItem'

/**
 * Crosses the teams and memberships data to see whether there is any team that the volunteer could still apply to
 * @param teams$
 * @param memberships$
 * @returns {Observable<Boolean>} A streamed value of `true` means that the volunteer has exhausted all the applicable
 * teams
 */
const hasNoMoreTeamsToApplyTo = (teams$, memberships$) => {
  return $.combineLatest(teams$, memberships$, (teams, memberships) => {
    const hasAppliedToTeam = memberships => team => memberships.some(m => m.teamKey === team.$key)

    return teams.every(hasAppliedToTeam(memberships))
  })
}

/**
 * Computes the operations related to the component which presents the user with the list of teams to apply to
 * @param sources
 * Mandatory extra sources (vs. `main`'s sources) include:
 * - teams$
 * - memberships$
 * @returns {{queue$: *, route$: (Observable|Observable<T>)}}
 * @constructor
 */
const AddToTeam = sources => {
  const list = List({
    ...sources,
    rows$: sources.teams$,
    Control$: of(AddTeamItem),
  })
  const disable$ = hasNoMoreTeamsToApplyTo(sources.teams$, sources.memberships$)

  return {
    ...ListItemWithMenu({
      ...sources,
      title$: of('Add to another team'),
      iconName$: of('plus-square'),
      menuItems$: of([list.DOM]),
      disable$: disable$,
    }),
    queue$: list.queue$,
    route$: list.route$.shareReplay(1),
  }
}

export default AddToTeam
