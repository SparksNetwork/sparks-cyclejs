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
import Collapsible from 'components/behaviors/Collapsible'

const OppQ = sources => QuotingListItem({...sources,
  profileKey$: sources.project$.map(prop('ownerProfileKey')),
  title$: sources.opp$.map(prop('question')),
  subtitle$: of('Organizer'),
})

const OppAnswer = sources => QuotingListItem({...sources,
  title$: sources.engagement$.pluck('answer'),
  default$: of('This person did not answer'),
  profileKey$: sources.profile$.map(prop('$key')),
  right$: of(true),
  subtitle$: of('Volunteer'),
})

const ViewEngagement = sources => ListItemNewTarget({
  iconName$: of('link'),
  title$: of('See their Engagement Page'),
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

