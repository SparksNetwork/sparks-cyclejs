import {cond, prop, T, always} from 'ramda'
import {Observable as $} from 'rx'
const {of, merge} = $
import {
  Teams,
  Memberships,
} from 'components/remote'
import {
  ActionButton,
  DescriptionListItem,
  QuotingListItem,
} from 'components/ui'
import {ListItemCollapsible} from 'components/sdm'
import {combineDOMsToDiv} from 'util'

import {div} from 'cycle-snabbdom'

const TeamQ = sources => QuotingListItem({...sources,
  profileKey$: sources.project$.pluck('ownerProfileKey'),
  title$: sources.team$.pluck('question'),
})

const TeamAnswer = sources => DescriptionListItem({...sources,
  title$: sources.item$.pluck('answer'),
  default$: of('This person did not answer'),
})

const TeamQandA = sources => ({
  DOM: combineDOMsToDiv('', TeamQ(sources), TeamAnswer(sources)),
})

function statusLabel({isAccepted, isDeclined}) {
  if (isAccepted) { return div({style: {color: 'green'}}, 'ACCEPTED') }
  if (isDeclined) { return div({class: {disabled: true}}, 'DENIED') }
  return div({class: {accent: true}}, '?')
}

const TeamItem = sources => {
  const team$ = sources.item$.pluck('teamKey')
    .flatMapLatest(Teams.query.one(sources))

  const title$ = team$.pluck('name')
  const rightDOM$ = sources.item$.map(statusLabel)

  const qa = TeamQandA({...sources, team$})

  const okButton = ActionButton({...sources,
    label$: of('Accept'),
    params$: of({isAccepted: true, isDeclined: false}),
  })

  const neverButton = ActionButton({...sources,
    label$: of('Deny'),
    params$: of({isAccepted: false, isDeclined: true}),
    classNames$: of(['red']),
  })

  const queue$ = merge(okButton.action$, neverButton.action$)
    .withLatestFrom(sources.item$, (action, item) => ({
      key: item.$key,
      values: action,
    }))
    .map(Memberships.action.update)

  const contentDOM$ = sources.item$.map(({isAccepted, isDeclined}) => {
    if (isAccepted) { return combineDOMsToDiv('', qa, neverButton)}
    if (isDeclined) { return combineDOMsToDiv('', qa, okButton)}
    return combineDOMsToDiv('', qa, okButton, neverButton)
  })

  const li = ListItemCollapsible({...sources, title$, rightDOM$, contentDOM$})
  return {...li, queue$: merge(li.queue$, queue$)}
}

export default TeamItem
