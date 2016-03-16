import {Observable} from 'rx'
import isolate from '@cycle/isolate'
import combineLatestObj from 'rx-combine-latest-obj'
import {col} from 'helpers'
import listItem from 'helpers/listItem'

import makeTextareaListItem from 'components/TextareaListItemFactory'

import {Opps, Fulfillers} from 'remote'

import {rows} from 'util'
import {log} from 'util'

const _toggleActions = sources => Observable.merge(
  sources.DOM.select('.fulfiller').events('click')
    .map(e => e.ownerTarget.dataset.key),
)

// const _teamsFulfilled = fulfillers => {
//   const lookup = {}
//   if (fulfillers) {
//     Object.keys(fulfillers).map(key => {
//       lookup[fulfillers[key].teamKey] = key
//     })
//   }
//   console.log('fulfilled', lookup)
//   return lookup
// }

const _renderTeams = (teamRows, fulfilledLookup) =>
  teamRows.length === 0 ? ['Add a team'] : [
    listItem({title: 'allowed teams', header: true}),
    listItem({
      title: 'What teams can applicants pick from?',
      subtitle:
        `Volunteers can fulfill their commitments
        with shifts from the teams you select.`,
    }),
    ...teamRows.map(t => listItem({
      title: t.name,
      className: 'fulfiller',
      key: t.$key,
      iconName:
        fulfilledLookup[t.$key] ? 'check_box' : 'check_box_outline_blank',
    })),
  ]

const _render = ({teams, fulfilledLookup, textareaQuestionDOM}) =>
  col(
    textareaQuestionDOM,
    ..._renderTeams(rows(teams), fulfilledLookup)
  )

const TextareaQuestion = makeTextareaListItem({
  iconName: 'playlist_add',
  title: 'You can ask people one special question when they apply.',
})

export default sources => {
  const fulfillers$ = sources.oppKey$
    .flatMapLatest(oppKey =>
      sources.firebase('Fulfillers', {
        orderByChild: 'oppKey',
        equalTo: oppKey,
      })
    )

  const fulfilledLookup$ = fulfillers$.map(fulfillers => {
    const lookup = {}
    if (fulfillers) {
      Object.keys(fulfillers).map(key => {
        lookup[fulfillers[key].teamKey] = key
      })
    }
    console.log('fulfilled', lookup)
    return lookup
  })

  const textareaQuestion = isolate(TextareaQuestion)({
    value$: sources.opp$.pluck('question'),
    ...sources,
  })

  const updateQuestion$ = textareaQuestion.value$
    .withLatestFrom(sources.oppKey$, (question,key) =>
      Opps.update(key,{question})
    )

  const clickedTeamKeys$ = _toggleActions(sources)

  clickedTeamKeys$.subscribe(log('teamKey$'))

  const addFulfiller$ = clickedTeamKeys$
    .withLatestFrom(
      sources.oppKey$,
      fulfilledLookup$,
      (teamKey,oppKey,fulfilledLookup) =>
        fulfilledLookup[teamKey] &&
          Fulfillers.delete(fulfilledLookup[teamKey]) ||
          Fulfillers.create({teamKey, oppKey})
    )

  addFulfiller$.subscribe(log('addFulfiller$'))

  const queue$ = Observable.merge(
    updateQuestion$,
    addFulfiller$,
  )

  const viewState = {
    textareaQuestionDOM: textareaQuestion.DOM,
    teams$: sources.teams$,
    fulfillers$,
    fulfilledLookup$,
  }

  sources.teams$.subscribe(log('teams$'))

  const DOM = combineLatestObj(viewState).map(_render)
  return {
    DOM,
    queue$,
  }
}
