import {Observable} from 'rx'
const {of, just, never, combineLatest} = Observable
import {mergeSinks, hideable} from 'util'

import {div} from 'cycle-snabbdom'


import {TabbedPage} from 'components/ui'

import {
  CardContainer,
  Card,
  LargeCard,
  ListItem,
} from 'components/sdm'

import {
  TitleListItem,
} from 'components/ui'

import EngagedList from 'components/EngagedList'

const LookupCard = sources => {
  const inst = ListItem(sources)
  const list = EngagedList(sources)
  const card = LargeCard({...sources,
    content$: just([inst.DOM, list.DOM]),
  })
  return {
    DOM: card.DOM,
    route$: list.route$,
    queue$: list.queue$,
  }
}

const Overview = sources => {
  const lookup = hideable(LookupCard)({...sources,
    title$: just('Find anyone who has ever applied for this project.'),
    rowLimit$: just(3),
    isVisible$: sources.engagements$.map(e => e.length > 0),
  })
  const cont = CardContainer({...sources,
    content$: just([lookup.DOM]),
  })
  return {
    DOM: cont.DOM,
    route$: lookup.route$,
    queue$: lookup.queue$,
  }
}

const FilteredView = (status, inst) => sources => {
  const lookup = LookupCard({...sources,
    title$: just(inst),
    rowLimit$: just(200),
    engagements$: sources[`${status}$`],
  })
  const cont = CardContainer({...sources,
    content$: just([lookup.DOM]),
  })
  return {
    DOM: cont.DOM,
    route$: lookup.route$,
    queue$: lookup.queue$,
  }
}

const _tabs = sources => combineLatest(
  sources.engagements$, sources.applied$, sources.accepted$, sources.confirmed$, sources.incomplete$, sources.rejected$,
  (all, applied, accepted, confirmed, incomplete, rejected) => [
    {path: '/', label: 'Overview'},
    {path: '/applied', label: `${applied.length} Applied`},
    {path: '/accepted', label: `${accepted.length} Accepted`},
    {path: '/confirmed', label: `${confirmed.length} Confirmed`},
    {path: '/incomplete', label: `${incomplete.length} Incomplete`},
    {path: '/rejected', label: `${rejected.length} Rejected`},
  ]
)

const _Page = sources => ({
  pageTitle: of('All Opportunities'),

  ...TabbedPage({...sources,
    tabs$: _tabs(sources),
    routes$: of({
      '/': Overview,
      '/applied': FilteredView('applied', 'Approve these people so they can pick shifts and confirm.'),
      '/accepted': FilteredView('accepted', 'These people need to sign in and confirm their spot.'),
      '/confirmed': FilteredView('confirmed', 'Here\'s everyone who has confirmed and should be there.'),
      '/incomplete': FilteredView('incomplete', 'These people started applying but never finished.'),
      '/rejected': FilteredView('rejected', 'You decided you didn\'t want these people picking shifts.'),
    }),
  }),
})

const filterApplied = e =>
  e.filter(x => !x.isAccepted && !x.declined && !x.isConfirmed)
const filterAccepted = e =>
  e.filter(x => x.isAccepted && !x.priority && !x.isConfirmed)
const filterConfirmed = e =>
  e.filter(x => x.isConfirmed)
const filterRejected = e =>
  e.filter(x => !x.isAccepted && x.declined && !x.isConfirmed)
const filterIncomplete = e => []

export default sources => {
  return _Page({...sources,
    applied$: sources.engagements$.map(filterApplied),
    accepted$: sources.engagements$.map(filterAccepted),
    confirmed$: sources.engagements$.map(filterConfirmed),
    rejected$: sources.engagements$.map(filterRejected),
    incomplete$: sources.engagements$.map(filterIncomplete),
  })
}
