import {Observable} from 'rx'
const {just, merge, combineLatest} = Observable
import {objOf} from 'ramda'
import {mapObjIndexed} from 'ramda'

import isolate from '@cycle/isolate'
import {AddCommitmentGive, AddCommitmentGet} from 'components/opp'
import codePopups from 'components/opp/codePopups'
import {Commitments} from 'components/remote'

import {div} from 'helpers'

import {CommitmentList} from 'components/commitment'

function EditFormPopup(sources) {
  const key$ = sources.editItem$.pluck('$key')

  const Popup$ = sources.editItem$
    .map(({code, ...others}) =>
      codePopups[code]({
        isOpen$: just(true),
        item$: just({code, ...others}),
        ...sources,
      })
    ).share()

  const item$ = Popup$.pluck('item$').switch()
  const submit$ = Popup$.pluck('submit$').switch()

  const editQueue$ = item$.sample(submit$)
    .map(mapObjIndexed(v => v || null))
    .withLatestFrom(key$)
    .map(([values, key]) => ({key, values}))
    .map(Commitments.action.update)

  const modalDOM = merge(
    Popup$.pluck('modalDOM').switch().startWith(null),
    submit$.map(null),
  )

  return {modalDOM, editQueue$}
}

export default sources => {
  const commitments$ = sources.oppKey$
    .flatMapLatest(Commitments.query.byOpp(sources))

  const gives$ = commitments$.map(rows => rows.filter(r => r.party === 'vol'))
  const gets$ = commitments$.map(rows => rows.filter(r => r.party === 'org'))

  const giveList = CommitmentList({...sources, rows$: gives$})
  const getList = CommitmentList({...sources, rows$: gets$})
  const editItem$ = merge(giveList.edit$, getList.edit$)

  const {modalDOM, editQueue$} = EditFormPopup({editItem$, ...sources})

  const addGive = isolate(AddCommitmentGive)(sources)
  const addGet = isolate(AddCommitmentGet)(sources)

  const commitment$ = Observable.merge(
    addGive.commitment$,
    addGet.commitment$,
  )

  const createQueues$ = commitment$
    .combineLatest(sources.oppKey$, (action,oppKey) => ({...action, oppKey}))
    .map(objOf('values'))
    .map(Commitments.action.create)

  const itemQueues$ = merge(
    giveList.queue$,
    getList.queue$,
  )

  const queue$ = merge(
    createQueues$,
    itemQueues$,
    editQueue$,
  )

  const DOM = combineLatest(
    addGive.DOM, giveList.DOM,
    addGet.DOM, getList.DOM,
    modalDOM,
    (...doms) => div({}, doms)
  )

  return {
    DOM,
    queue$,
  }
}
