import {Observable} from 'rx'
const {just, combineLatest} = Observable

import {div, h5, p, hr} from 'cycle-snabbdom'
import {iconSrc} from 'helpers'

import {
  List,
  ListItem,
  ListItemWithDialog,
} from 'components/sdm'

import {
  EngagementButtons,
} from 'components/engagement'

import {
  Profiles,
  Engagements,
  Memberships,
  Teams,
} from 'components/remote'

const QuoteListItem = sources =>
  ListItem({...sources, classes$: just({quote: true, yellow: true})}).DOM

const RightQuoteListItem = sources =>
  ListItem({...sources,
    classes$: just({quote: true, rotate: true, blue: true})}).DOM

const toValues = value => {
  switch (value) {
  case 'priority': return {isAccepted: true, priority: true}
  case 'accept': return {isAccepted: true, priority: false}
  case 'decline': return {isAccepted: false, priority: false}
  default: return {isAccepted: 'false'}
  }
}

const defaultIntro =
  'This applicant has not completed the intro section of their profile'
const defaultSkills =
  'This applicant has not completed the skills section of their profile'
const defaultOppAnswer =
  'This applicant did not answer the opportunity question'
const defaultTeamAnswer =
  'This applicant did not answer the team question'

const dialogStyle = {
  maxWidth: '31rem',
  margin: '0 auto',
  maxHeight: '37rem',
  overflow: 'auto',
  paddingLeft: '1em',
  paddingRight: '1em',
}

const dialogView = (
  {intro = defaultIntro, skills = defaultSkills, portraitUrl},
  {opp: {question: oppQuestion}, answer: oppAnswer = defaultOppAnswer},
  {answer: teamAnswer = defaultTeamAnswer},
  {question: teamQuestion},
  {portraitUrl: ownerPicUrl},
) =>
    div({style: dialogStyle}, [
      div({}, [
        h5({style: {textDecoration: 'underline'}}, ['Introduction']),
        p({style: {fontWeight: 'bold'}}, intro),
      ]),
      hr({}, []),
      div({}, [
        RightQuoteListItem({title$: just(oppQuestion)}),
      ]),
      div({style: {display: 'flex', flexDirection: 'row'}}, [
        div({style: {flexGrow: '1'}}, [
          QuoteListItem({title$: just(oppAnswer)}),
        ]),
        div({style: {margin: '0.4em'}} , [iconSrc(ownerPicUrl)]),
      ]),
      div({style: {display: 'flex', flexDirection: 'row'}}, [
        div({style: {marginTop: '-0.6em'}}, [iconSrc(portraitUrl)]),
        div({style: {flexGrow: '1'}}, [
          RightQuoteListItem({title$: just(teamQuestion)}),
        ]),
      ]),
      div({style: {display: 'flex', flexDirection: 'row'}}, [
        div({style: {flexGrow: '1'}}, [
          QuoteListItem({title$: just(teamAnswer)}),
        ]),
        div({style: {margin: '0.4em'}}, [iconSrc(ownerPicUrl)]),
      ]),
      div({style: {display: 'flex', flexDirection: 'row'}}, [
        div({style: {marginTop: '-0.6em'}}, [
          iconSrc(portraitUrl),
        ]),
        h5({style: {textAlign: 'center', flexGrow: '1'}}, 'Other Skills'),
      ]),
      hr({}, []),
      div({}, [
        p({}, skills),
      ]),
    ])

const Item = sources => {
  const item$ = sources.item$.shareReplay(1)
  const memberships$ = sources.engagements$
    .pluck('$key')
    .flatMapLatest(Memberships.query.byEngagement(sources))
    .map(arr => arr[0])
    .shareReplay(1)

  const team$ = memberships$
    .pluck('teamKey')
    .flatMapLatest(Teams.query.one(sources))

  const profile$ = item$
    .pluck('profileKey')
    .flatMapLatest(Profiles.query.one(sources))
    .shareReplay(1)

  const ownerProfile$ = team$
    .pluck('project', 'ownerProfileKey')
    .flatMapLatest(Profiles.query.one(sources))
    .shareReplay(1)

  const dialogContentDOM$ = combineLatest(
    profile$, item$, memberships$, team$, ownerProfile$,
    dialogView
  )

  const actionsComponent$ = just(EngagementButtons(sources))

  const {DOM, value$} = ListItemWithDialog({...sources,
    title$: profile$.pluck('fullName'),
    iconUrl$: profile$.pluck('portraitUrl'),
    dialogTitleDOM$: profile$.pluck('fullName')
      .map(fullName => `${fullName}'s Application`),
    dialogContentDOM$,
    actionsComponent$,
  })

  const queue$ = value$.map(toValues).withLatestFrom(
    item$.pluck('$key'),
    (values, key) => ({key, values})
  ).map(Engagements.action.update)

  return {DOM, queue$}
}

const AppList = sources => List({...sources,
  Control$: just(Item),
  rows$: sources.engagements$,
})

const Fetch = sources => ({
  engagements$: sources.oppKey$
    .flatMapLatest(Engagements.query.byOpp(sources))
    .shareReplay(1),
})

export default sources => {
  const _sources = {...sources, ...Fetch(sources)}

  const {DOM: listDOM, edit$, queue$, route$} = AppList(_sources)

  const DOM = _sources.engagements$.map(
    engagements => engagements.length === 0 ?
      just(h5('No applications awaiting approval')) :
      listDOM
  ).switch()

  return {DOM, queue$, route$, edit$}
}
