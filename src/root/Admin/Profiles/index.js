import {Observable as $} from 'rx'
const {just} = $
import combineLatestObj from 'rx-combine-latest-obj'
import isolate from '@cycle/isolate'
import {formatTime, mergeSinks} from 'util'
import {
  complement, T, allPass, always, any, compose, cond, filter, head, ifElse,
  isEmpty, join, map, path, pathOr, prop, propEq, props, split, toLower,
  useWith, applySpec, propOr,
} from 'ramda'

import {div, img, span} from 'cycle-snabbdom'
import {combineDOMsToDiv} from 'util'

import {icon, iconSrc} from 'helpers'

import {
  List,
  ListWithHeader,
  ListItem,
  ListItemClickable,
  InputControl,
  LargeCard,
  TitledCard,
} from 'components/sdm'

import Collapsible from 'components/Collapsible'
import Navigatable from 'components/Navigatable'

import {
  Loader,
} from 'components/ui'

import {
  ArrivalsFetcher,
  AssignmentsFetcher,
  EngagementsFetcher,
  OrganizersFetcher,
  ProfilesFetcher,
} from './fetcher'

require('./styles.scss')

const SearchBox = sources => {
  const focus$ = sources.DOM.select('.profiles-search').observable
    .filter(complement(isEmpty))
    .map({selector: '.profiles-search input'})

  const input = isolate(InputControl)({
    label$: $.of('Search'),
    ...sources,
  })

  const vtree$ = input.DOM.map(i =>
    div('.profiles-search', [i]))

  return {
    ...input,
    DOM: vtree$,
    focus$,
    term$: input.value$,
  }
}

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
      div('.content.xcol-sm-4', [
        div('.title', pathOr('err', ['project', 'name'], eng)),
      ]),
      div('.content.xcol-sm-4', [
        div('.title', pathOr('err', ['opp', 'name'], eng)),
        div('.subtitle', engStatus(eng)),
      ]),
      div('.content.xcol-sm-3', [assignmentsDOM]),
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
          div('.title', prop('startTime', ass)),
          div('.subtitle', 'Start Time'),
        ]),
        div('.content-xcol-sm-4', [
          div('.title', prop('endTime', ass)),
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

const ProfileView = sources => {
  const profile$ = sources.profile$
  const organizers$ = OrganizersFetcher(sources)
  const engagements$ = EngagementsFetcher(sources)
  const arrivals$ = ArrivalsFetcher(sources)

  const LoadingHeader = sources => ListItem({
    classes$: just({header: true}),
    title$: sources.title$,
    leftDOM$: sources.watch$.startWith(true).map(false)
      .map(showl =>
        showl ?
          Loader({
            ...sources,
            visible$: sources.watch$.startWith(true).map(false),
          }).DOM :
          (sources.iconName$ || just('none')).map(icon)
      )
      .switch(),
  })

  const orgHeader = LoadingHeader({
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

  const engHeader = LoadingHeader({
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

  const arrHeader = LoadingHeader({
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

  const lists = [orgList, engList, arrList]

  const fieldRow = (label, value) =>
    div('.list-item', [
      div('.content.xcol-sm-12', [
        div('.title', [value]),
        div('.subtitle', [label]),
      ]),
    ])

  const listRow = list =>
    div('.row', [div('.col-xs-12', [list])])

  const content$ = combineLatestObj({
    orgListDOM$: orgList.DOM,
    engListDOM$: engList.DOM,
    arrListDOM$: arrList.DOM,
    profile$,
  })
    .map(({orgListDOM, engListDOM, arrListDOM, profile}) => [
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
        ]),
      ]),
      listRow(orgListDOM),
      listRow(engListDOM),
      listRow(arrListDOM),
    ])
  .shareReplay(1)

  const card = TitledCard({
    ...sources,
    content$,
    title$: profile$.pluck('fullName'),
    cardComponent: LargeCard,
  })

  return {
    DOM: card.DOM,
    ...mergeSinks(...lists),
  }
}

const ProfileListItem = sources => {
  const profile$ = sources.item$

  const icon$ = profile$.map(profile =>
    div('.profile-portrait', [
      iconSrc(profile.portraitUrl),
    ]))

  const li = isolate(ListItemClickable)({
    ...sources,
    title$: profile$.pluck('fullName'),
    subtitle$: profile$.pluck('email'),
    leftDOM$: icon$,
  })

  return {
    ...li,
  }
}

const ProfileList = sources => ({
  ...List({
    ...sources,
    Control$: $.just(ProfileListItem),
    rows$: sources.profiles$,
  }),
})

const SearchResults = sources => {
  const profiles$ = sources.profiles$

  const oneProfile$ = profiles$
    .map(propEq('length', 1))
    .distinctUntilChanged()
    .shareReplay(1)

  const control$ = oneProfile$.map(oneProfile =>
    oneProfile ?
      ProfileView({
        ...sources,
        profile$: profiles$.map(head),
      }) :
      ProfileList(sources))
    .shareReplay(1)

  return {
    DOM: control$.map(prop('DOM')).switch(),
    ...mergeSinks(control$),
  }
}

const profileMatchesTerm = (term) =>
  compose(any(text => text.includes(term)), prop('search'))

const prepareText = compose(
  split(' '),
  toLower,
  join(' ')
)

const prepareProfile = profile =>
  ({...profile,
    search: prepareText(props(['fullName', 'email', 'phone'], profile))})

const Profiles = unfetchedSources => {
  const sources = {...unfetchedSources, ...ProfilesFetcher(unfetchedSources)}

  const preparedProfiles$ = sources.profiles$
    .map(map(prepareProfile))
    .shareReplay(1)

  const searchBox = SearchBox(sources)
  const term$ = searchBox.term$
    .map(ifElse(Boolean, toLower, always('')))
    .distinctUntilChanged()
    .shareReplay(1)

  const preparedTerm$ = term$
    .map(compose(map(profileMatchesTerm), split(' ')))

  const profiles$ = $.combineLatest(
    preparedTerm$,
    preparedProfiles$,
    useWith(filter, [allPass]))
  .startWith([])
  .shareReplay(1)

  const list = SearchResults({...sources, profiles$, key$: searchBox.key$})
  const DOM = combineDOMsToDiv('', searchBox, list)

  return {
    ...mergeSinks(searchBox, list),
    DOM,
  }
}

export default Profiles
