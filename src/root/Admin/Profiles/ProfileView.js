import {Observable as $} from 'rx'
const {just, of, combineLatest} = $

import {
  prop, always, cond,
  T, lensPath, set, apply,
} from 'ramda'

import combineLatestObj from 'rx-combine-latest-obj'
import {div, img} from 'cycle-snabbdom'

import {mergeSinks, requireSources} from 'util'

import {
  ListWithHeader,
  ListItemLoadingHeader,
  ListItemHeader,
  LargeCard,
  Icon,
} from 'components/sdm'

import {ViewWithDetail} from 'components/ui'
import {EngagementView} from 'components/EngagedList/EngagementView'
import {Clickable} from 'components/behaviors'

import {
  ArrivalsFetcher,
  EngagementsFetcher,
  OrganizersFetcher,
  ProfileFetcher,
} from './fetcher'

import {ArrivalListItem} from './ArrivalListItem'
import {EngagementListItem} from './EngagementListItem'
import {OrganizerListItem} from './OrganizerListItem'

const superLens = lensPath(['data', 'supernova'])
const keyLens = lensPath(['key'])

const role = cond([
  [prop('isAdmin'), always('Administrator')],
  [prop('isEAP'), always('Early Access Partner')],
  [T, always('Volunteer')],
])

const Profile = ProfileFetcher(sources => {
  requireSources('Profile', sources, 'profile$')

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
    backButton.click$.map(sources.createHref.list))

  return {
    DOM,
    ...sinks,
    route$,
  }
})

const ProfileView = sources => {
  return ViewWithDetail({
    ...sources,
    viewControl: Profile,
    detailControl: EngagementView,
  }, {name: 'engagement', cols: [2, 10]})
}

export {ProfileView}
