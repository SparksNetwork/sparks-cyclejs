import {Observable} from 'rx'
const {empty, just, merge} = Observable
import combineLatestObj from 'rx-combine-latest-obj'

import {col, div} from 'helpers'
import listItem from 'helpers/listItem'
import menuItem from 'helpers/menuItem'
import {DropdownMenu} from 'components/DropdownMenu'

import makeInputControl from 'components/InputControlFactory'
import {Commitments} from 'components/remote'

import {log} from 'util'

const _openActions$ = ({DOM}) => Observable.merge(
  DOM.select('.clickable').events('click').map(() => true),
)

const toHelp = () =>
  menuItem({
    iconName: 'users',
    title: 'To help with __________',
  })

const ticketTo = () =>
  menuItem({
    iconName: 'ticket',
    title: 'A ticket to __________',
  })

const benefits = () =>
  menuItem({
    iconName: 'insert_invitation',
    title: 'The awesome benefits of ......',
  })

const extras = () =>
  menuItem({
    iconName: 'build',
    title: 'All these awesome extras: _________',
  })

const _render = ({dropdownDOM, getHelpModalDOM}) =>
  col(
    listItem({
      iconName: 'plus',
      title: 'What do Volunteers GET?',
      iconBackgroundColor: 'yellow',
      clickable: true,
    }),
    dropdownDOM,
    getHelpModalDOM,
  )

import {makeModal} from 'components/ui'

const GetHelpModal = makeModal({
  title: 'a title',
  icon: 'power',
})


const WhoInput = makeInputControl({
  label: 'Who is being helped?',
  className: 'help',
})

const GetHelpForm = sources => {
  const whoInput = WhoInput(sources)

  const commitment$ = combineLatestObj({
    who$: whoInput.value$,
  })

  const viewState = {
    whoInputDOM: whoInput.DOM,
  }

  const DOM = combineLatestObj(viewState).map(({whoInputDOM}) =>
    col(whoInputDOM)
  )

  return {
    DOM,
    commitment$,
  }
}

const GetHelp = sources => {
  const isOpen$ = sources.DOM.select('.get-help').events('click')
    .map(true)
    .startWith(false)
  const f = GetHelpForm(sources)
  const m = GetHelpModal({contentDOM$: f.DOM, isOpen$, ...sources})

  const itemDOM = just(
    menuItem({
      iconName: 'users',
      title: 'To help a community',
      className: 'get-help',
    }),
  )

  const modalDOM = m.DOM

  const commitment$ = f.commitment$
    .sample(m.submit$)

  return {
    itemDOM,
    modalDOM,
    commitment$,
  }
}

export const AddCommitmentGet = sources => {
  const isOpen$ = _openActions$(sources).startWith(false)

  const getHelp = GetHelp(sources)

  const children$ = just([div({},[
    getHelp.itemDOM,
    ticketTo(),
    benefits(),
    extras(),
  ])])

  const dropdown = DropdownMenu({...sources, isOpen$, children$})

  const viewState = {
    dropdownDOM$: dropdown.DOM,
    getHelpModalDOM$: getHelp.modalDOM,
  }

  const DOM = combineLatestObj(viewState).map(_render)

  const commitment$ = merge(
    getHelp.commitment$,
  )

  return {
    DOM,
    isOpen$,
    queue$: empty(),
    commitment$,
  }
}
