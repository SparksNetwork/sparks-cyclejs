import {Observable as $} from 'rx'
const {merge, of, combineLatest} = $
import {objOf} from 'ramda'
import {div} from 'cycle-snabbdom'
import {
  Engagements,
  Memberships,
} from 'components/remote'

import {
  ListItemClickable,
} from 'components/sdm'

const AddTeamItem = sources => {
  const li = ListItemClickable({...sources,
    title$: sources.item$.pluck('name'),
  })

  const teamKey$ = sources.item$.pluck('$key')

  const createMembership$ = combineLatest(
      teamKey$, sources.engagementKey$, sources.oppKey$,
      (teamKey, engagementKey, oppKey) => ({
        teamKey,
        engagementKey,
        oppKey,
        isApplied: true,
        isAccepted: true,
        answer: 'Added by organizer',
      })
    )
    .sample(li.click$)
    .map(objOf('values'))
    .map(Memberships.action.create)

  const queue$ = createMembership$.share()

  const DOM = sources.item$.combineLatest(sources.memberships$,
    (item, memberships) => !memberships.some(m => m.teamKey === item.$key) ?
      li.DOM :
      of(div([null]))
  ).switch()

  return {...li, DOM, queue$}
}

export default AddTeamItem
