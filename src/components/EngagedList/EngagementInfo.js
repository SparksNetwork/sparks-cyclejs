import {Observable as $} from 'rx'
const {of} = $
import {
  prop,
} from 'ramda'
import {combineDOMsToDiv} from 'util'
import {
  QuotingListItem,
} from 'components/ui'
import {
  ListItemNewTarget,
  ListItemHeader,
} from 'components/sdm'
import {div} from 'cycle-snabbdom'
import Collapsible from 'components/behaviors/Collapsible'

const OppQ = sources => QuotingListItem({
  ...sources,
  profileKey$: sources.project$.map(prop('ownerProfileKey')),
  title$: sources.opp$.map(prop('question')),
  subtitle$: of('Organizer'),
})

const OppAnswer = sources => QuotingListItem({
  ...sources,
  title$: sources.engagement$.pluck('answer'),
  default$: of('This person did not answer'),
  profileKey$: sources.profile$.map(prop('$key')),
  right$: of(true),
  subtitle$: of('Volunteer'),
})

function statusLabel({isAccepted, declined}) {
  if (isAccepted) {
    return div({style: {color: 'green'}}, 'APPROVED')
  }
  if (declined) {
    return div({class: {disabled: true}}, 'REJECTED')
  }
  return div({class: {accent: true}}, '?')
}

const ViewEngagement = sources => ListItemNewTarget({
  iconName$: of('link'),
  title$: sources.opp$.pluck('name'),
  subtitle$: of('Click to see their Engagement Page'),
  rightDOM$: sources.engagement$.map(statusLabel),
  url$: sources.engagement$.map(prop('$key'))
    .map(k => `/engaged/${k}`),
})

const EngagementInfo = sources => {
  const header = Collapsible(ListItemHeader)({
    ...sources,
    title$: of('Engagement'),
    iconName$: of('event_available'),
    contentDOM$: combineDOMsToDiv('',
      ViewEngagement(sources),
      OppQ(sources),
      OppAnswer(sources),
    ),
  })

  const DOM = header.DOM

  return {
    DOM,
  }
}

export default EngagementInfo

