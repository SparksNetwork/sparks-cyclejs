import {Observable as $} from 'rx'
const {just} = $
import {pathOr, prop, always, T, cond} from 'ramda'
import {List, Link} from 'components/sdm'
import {Collapsible} from 'components/behaviors'
import {div, span} from 'cycle-snabbdom'
import {Loader} from 'components/ui'
import {mergeSinks} from 'util'

import {AssignmentsFetcher} from './fetcher'
import {TeamListItem} from './TeamListItem'

const engStatus = cond([
  [prop('declined'), always('Declined')],
  [prop('isPaid'), always('Paid and confirmed')],
  [prop('isConfirmed'), always('Confirmed')],
  [prop('isAccepted'), always('Accepted')],
  [prop('isApplied'), always('Applied')],
  [T, always('Unknown')],
])

const InnerEngagementListItem = sources => {
  const assignmentsDOM$ = sources.assignments$
    .map(assignments =>
      just(div('.title', `${assignments.length} Assignments`)))
    .startWith(Loader(sources).DOM)
    .switch()

  const engagementLink = Link({
    ...sources,
    content$: just('View engagement'),
    path$: sources.item$.map(eng =>
      sources.createHref(`/show/${eng.$key}`)),
  })

  const DOM = $.combineLatest(
    sources.item$,
    assignmentsDOM$,
    engagementLink.DOM,
  ).map(([eng, assignmentsDOM, linkDOM]) =>
    div('.list-item', [
      div('.content.xcol-sm-3', [
        div('.title', pathOr('err', ['project', 'name'], eng)),
      ]),
      div('.content.xcol-sm-3', [
        div('.title', pathOr('err', ['opp', 'name'], eng)),
        div('.subtitle', engStatus(eng)),
      ]),
      div('.content.xcol-sm-3', [assignmentsDOM]),
      div('.content.xcol-sm-3', [linkDOM]),
    ])
  )

  return {
    route$: engagementLink.route$,
    DOM,
  }
}

export const EngagementListItem = sources => {
  const assignments$ = AssignmentsFetcher({
    ...sources,
    engagement$: sources.item$,
  })

  const teamsList = List({
    ...sources,
    Control$: just(TeamListItem),
    rows$: assignments$.startWith([]),
    emptyDOM: just(div('No assignments')),
  })

  const engagementListItem = InnerEngagementListItem({
    ...sources,
    assignments$,
    contentDOM$: teamsList.DOM,
  })

  return {
    ...mergeSinks(teamsList, engagementListItem),
    DOM: engagementListItem.DOM,
  }
}
