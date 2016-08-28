import {Observable as $} from 'rx'
const {just, merge} = $
import {path, prop, always, T, cond} from 'ramda'
import {List, Link} from 'components/sdm'
import {div} from 'cycle-snabbdom'
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
    path$: sources.item$
      .map(prop('$key'))
      .map(sources.createHref.item),
  })

  const projectLink = Link({
    ...sources,
    content$: sources.item$.map(path(['project', 'name'])),
    path$: sources.item$
      .map(path(['project', '$key']))
      .map(key => `/project/${key}`),
  })

  const oppLink = Link({
    ...sources,
    content$: sources.item$.map(path(['opp', 'name'])),
    path$: sources.item$
      .map(path(['opp', '$key']))
      .map(key => `/opp/${key}`),
  })

  const DOM = $.combineLatest(
    sources.item$,
    projectLink.DOM,
    oppLink.DOM,
    assignmentsDOM$,
    engagementLink.DOM,
  ).map(([eng, projectLinkDOM, oppLinkDOM, assignmentsDOM, linkDOM]) =>
    div('.list-item', [
      div('.content.xcol-sm-3', [
        div('.title', [projectLinkDOM]),
      ]),
      div('.content.xcol-sm-3', [
        div('.title', [oppLinkDOM]),
        div('.subtitle', engStatus(eng)),
      ]),
      div('.content.xcol-sm-3', [assignmentsDOM]),
      div('.content.xcol-sm-3', [linkDOM]),
    ])
  )

  const route$ = merge(
    engagementLink.route$,
    projectLink.route$,
    oppLink.route$
  )

  return {
    route$,
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
