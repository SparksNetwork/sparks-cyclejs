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

const getTeamTitle = ({isAccepted = false, isDeclined = false}, {name}) => {
  if (isAccepted === true) { return `${name} - Accepted` }
  return isDeclined ? `${name} - Declined` : `${name}`
}

const TeamItem = sources => {
  const team$ = sources.item$.pluck('teamKey')
    .flatMapLatest(Teams.query.one(sources))

  const title$ = sources.item$.combineLatest(team$, getTeamTitle)

  const qa = TeamQandA({...sources, team$})

  const okButton = ActionButton({...sources,
    label$: of('Ok'),
    params$: of({isAccepted: true, isDeclined: false}),
  })

  const neverButton = ActionButton({...sources,
    label$: of('Never'),
    params$: of({isAccepted: false, isDeclined: true}),
    classNames$: of(['red']),
  })

  const queue$ = merge(okButton.action$, neverButton.action$)
    .withLatestFrom(sources.item$, (action, item) => ({
      key: item.$key,
      values: action,
    }))
    .map(Memberships.action.update)

  const contentDOM$ = combineDOMsToDiv('', qa, okButton, neverButton)

  const li = ListItemCollapsible({...sources, title$, contentDOM$})
  return {...li, queue$: merge(li.queue$, queue$)}
}

export default TeamItem
