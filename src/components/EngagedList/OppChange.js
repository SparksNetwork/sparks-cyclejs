import {Observable as $} from 'rx'
const {of, combineLatest} = $
import {
  prop, reject, propEq,
} from 'ramda'
import {
  ListItemHeader,
  ListItem,
  List,
} from 'components/sdm'
import Collapsible from 'components/behaviors/Collapsible'
import Clickable from 'components/behaviors/Clickable'
import {
  Engagements,
} from 'components/remote'

const OppItem = sources => {
  const listItem = Clickable(ListItem)({
    ...sources,
    title$: sources.item$.map(opp => `Move to ${opp.name}`),
  })

  // Send an update to the queue with the new opp key
  const queue$ = combineLatest(
    sources.engagementKey$,
    sources.item$.map(prop('$key'))
  )
  .map(([key, oppKey]) => ({key, values: {oppKey}}))
  .map(Engagements.action.update)
  .sample(listItem.click$)

  // When we're on this screen and the engagement changes to be the same opp
  // we're assuming that we did that so we 'follow' the engagement to it's new
  // home
  const route$ = sources.item$.map(prop('$key')).flatMapLatest(oppKey =>
    sources.engagement$.filter(propEq('oppKey', oppKey))
  )
  .map(eng => `/opp/${eng.oppKey}/engaged/show/${eng.$key}`)

  return {
    ...listItem,
    queue$,
    route$,
  }
}

/*
* This is the component on the engagement list detail screen that allows admins
* to change the opportunity. It shows a list of available opps.
*/
const OppChange = sources => {
  const list = List({
    ...sources,
    rows$: sources.oppKey$.flatMapLatest(oppKey =>
      sources.opps$
        .map(reject(propEq('$key', oppKey)))),
    Control$: of(OppItem),
  })

  const cannotChange = ListItem({
    title$: of('Cannot change opportunity of confirmed volunteer'),
  })

  const header = Collapsible(ListItemHeader)({
    ...sources,
    title$: of('Change Opportunity'),
    iconName$: of('directions_run'),
    contentDOM$: sources.engagement$.flatMapLatest(engagement =>
      engagement.isConfirmed ?
        cannotChange.DOM :
        list.DOM
      ),
  })

  return {
    ...list,
    DOM: header.DOM,
  }
}

export default OppChange
