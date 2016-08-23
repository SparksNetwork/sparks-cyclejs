import {Observable as $} from 'rx'
const {just, of, combineLatest} = $

import {
  path, ifElse, prop, always, compose, join, applySpec, pathOr, propOr, cond,
  T, lensPath, set, apply,
} from 'ramda'

import combineLatestObj from 'rx-combine-latest-obj'
import {div, img, span, a} from 'cycle-snabbdom'

import {formatTime, mergeSinks, requireSources} from 'util'

import {
  List,
  ListWithHeader,
  ListItemLoadingHeader,
  ListItem,
  ListItemHeader,
  LargeCard,
  Icon,
} from 'components/sdm'

import {
  Clickable, Collapsible, Navigatable,
} from 'components/behaviors'

import {
  Loader,
} from 'components/ui'

import {
  ArrivalsFetcher,
  AssignmentsFetcher,
  EngagementsFetcher,
  OrganizersFetcher,
  ProfileFetcher,
} from './fetcher'

const superLens = lensPath(['data', 'supernova'])
const keyLens = lensPath(['key'])

const role = cond([
  [prop('isAdmin'), always('Administrator')],
  [prop('isEAP'), always('Early Access Partner')],
  [T, always('Volunteer')],
])

const engStatus = cond([
  [prop('declined'), always('Declined')],
  [prop('isPaid'), always('Paid and confirmed')],
  [prop('isConfirmed'), always('Confirmed')],
  [prop('isAccepted'), always('Accepted')],
  [prop('isApplied'), always('Applied')],
  [T, always('Unknown')],
])

const OrganizerListItem = sources => {
  return Navigatable(ListItem)({
    ...sources,
    title$: sources.item$
      .map(path(['project', 'name'])),
    subtitle$: sources.item$
      .map(ifElse(prop('isAccepted'), always('Accepted'), always('Invited'))),
    path$: sources.item$
      .map(compose(join(''), applySpec([
        always('/project/'),
        prop('projectKey'),
      ]))),
  })
}

const InnerEngagementListItem = sources => {
  const assignmentsDOM$ = sources.assignments$
    .map(assignments =>
      just(div('.title', `${assignments.length} Assignments`)))
    .startWith(Loader(sources).DOM)
    .switch()

  const DOM = $.combineLatest(
    sources.item$,
    assignmentsDOM$
  ).map(([eng, assignmentsDOM]) =>
    div('.list-item', [
      div('.xcol-sm-1', [
        span('.icon-plus'),
      ]),
      div('.content.xcol-sm-3', [
        div('.title', pathOr('err', ['project', 'name'], eng)),
      ]),
      div('.content.xcol-sm-3', [
        div('.title', pathOr('err', ['opp', 'name'], eng)),
        div('.subtitle', engStatus(eng)),
      ]),
      div('.content.xcol-sm-3', [assignmentsDOM]),
      div('.content.xcol-sm-3', [
        a({attrs: {href: `/engaged/${eng.$key}`}}, 'View engagement page'),
      ]),
    ])
  )

  return {DOM}
}

const TeamListItem = sources => {
  const li = sources => {
    const ass$ = sources.item$

    const DOM = ass$.map(ass =>
      div('.list-item', [
        div('.content-xcol-sm-4', [
          div('.title', pathOr('err', ['team', 'name'], ass)),
          div('.subtitle', 'Team'),
        ]),
        div('.content-xcol-sm-4', [
          div('.title', propOr('no time', 'startTime', ass)),
          div('.subtitle', 'Start Time'),
        ]),
        div('.content-xcol-sm-4', [
          div('.title', propOr('no time', 'endTime', ass)),
          div('.subtitle', 'End Time'),
        ]),
      ])
    )

    return {DOM}
  }

  return Navigatable(li)({
    ...sources,
    path$: sources.item$
      .map(compose(join(''), applySpec([
        always('/team/'),
        prop('teamKey'),
      ]))),
  })
}

const EngagementListItem = sources => {
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

  const engagementListItem = Collapsible(InnerEngagementListItem)({
    ...sources,
    assignments$,
    contentDOM$: teamsList.DOM,
  })

  return {
    ...mergeSinks(teamsList, engagementListItem),
    DOM: engagementListItem.DOM,
  }
}

const ArrivalListItem = sources => {
  const arr$ = sources.item$

  return ListItem({
    ...sources,
    title$: arr$.map(pathOr('err', ['project', 'name'])),
    subtitle$: arr$.map(arr =>
      `At ${formatTime(arr.arrivedAt)}`),
  })
}

const Detail = ProfileFetcher(sources => {
  requireSources('ProfileView', sources, 'profile$')

  const profile$ = sources.profile$
  const organizers$ = OrganizersFetcher(sources)
  const engagements$ = EngagementsFetcher(sources)
  const arrivals$ = ArrivalsFetcher(sources)

  const backButton = Clickable(Icon)({
    ...sources,
    iconName$: of('arrow_back'),
  })

  const header = ListItemHeader({
    ...sources,
    title$: profile$.map(prop('fullName')),
    leftDOM$: backButton.DOM,
  })

  const orgHeader = ListItemLoadingHeader({
    ...sources,
    title$: just('Organizer of'),
    watch$: organizers$,
    iconName$: just('key'),
  })

  const orgList = ListWithHeader({
    ...sources,
    headerDOM: orgHeader.DOM,
    Control$: $.just(OrganizerListItem),
    rows$: organizers$.startWith([]),
    emptyDOM$: just(div('No projects')),
  })

  const engHeader = ListItemLoadingHeader({
    ...sources,
    title$: just('Engagements'),
    watch$: engagements$,
    iconName$: just('ticket'),
  })

  const engList = ListWithHeader({
    ...sources,
    headerDOM: engHeader.DOM,
    Control$: $.just(EngagementListItem),
    rows$: engagements$.startWith([]),
    emptyDOM$: just(div('No engagements')),
  })

  const arrHeader = ListItemLoadingHeader({
    ...sources,
    title$: just('Arrivals'),
    watch$: arrivals$,
    iconName$: just('enter'),
  })

  const arrList = ListWithHeader({
    ...sources,
    headerDOM: arrHeader.DOM,
    Control$: $.just(ArrivalListItem),
    rows$: arrivals$.startWith([]),
    emptyDOM$: just(div('No arrivals')),
  })

  const fieldRow = (label, value) =>
    div('.list-item', [
      div('.content.xcol-sm-12', [
        div('.title', [value]),
        div('.subtitle', [label]),
      ]),
    ])

  const listRow = list =>
    div('.row', [div('.col-xs-12', [list])])

  const children = [orgList, engList, arrList]

  const content$ = combineLatestObj({
    orgListDOM$: orgList.DOM,
    engListDOM$: engList.DOM,
    arrListDOM$: arrList.DOM,
    profile$,
  })
    .map(({orgListDOM, engListDOM, arrListDOM, profile}) => div([
      div('.row', [
        div('.col-xs-4.profile-portrait.big', {
          style: {position: 'relative'},
        }, [
          img({attrs: {src: profile.portraitUrl},
            style: {width: '100%', display: 'block', borderRadius: '50%'}}),
        ]),
        div('.col-xs-8', [
          fieldRow('Email', profile.email),
          fieldRow('Phone', profile.phone),
          fieldRow('Role', role(profile)),
          fieldRow('Profile Key', profile.$key),
          fieldRow('UID', profile.uid),
        ]),
      ]),
      listRow(orgListDOM),
      listRow(engListDOM),
      listRow(arrListDOM),
    ]))

  const card = LargeCard({
    ...sources,
    content$: combineLatest(header.DOM, content$),
  })

  const DOM = combineLatest(
    profile$.map(prop('$key')),
    card.DOM
      .map(set(superLens, {
        in: {className: 'slide-from-right'},
        out: {className: 'fade-out', duration: 500},
      })),
  )
  .map(apply(set(keyLens)))

  const sinks = mergeSinks(...children)

  const route$ = sinks.route$.merge(
    backButton.click$.map(always(''))
      .map(sources.createHref))

  return {
    DOM,
    ...sinks,
    route$,
  }
})

export {Detail}
