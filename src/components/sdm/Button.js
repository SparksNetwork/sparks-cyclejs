//placeholder for replacement w cyclic-surface-material
import {Observable} from 'rx'
const {just, combineLatest} = Observable
import {not} from 'ramda'

// import isolate from '@cycle/isolate'

import combineLatestObj from 'rx-combine-latest-obj'
import {Button} from 'snabbdom-material'
import {div} from 'helpers'
import {span} from 'cycle-snabbdom'

import newId from './id'

const FlatButton = sources => {
  const id = newId()

  const viewState = {
    label$: sources.label$ || just('Button'),
    classNames$: sources.classNames$ || just([]),
  }

  const click$ = sources.DOM.select('.' + id).events('click')

  const DOM = combineLatestObj(viewState)
    .map(({label, classNames}) =>
      Button({
        onClick: true,
        flat: true,
        className: [id, ...classNames].join('.'),
      }, [
        label,
      ]),
    )

  return {
    DOM,
    click$,
  }
}

const RaisedButton = sources => {
  const id = newId()

  const viewState = {
    label$: sources.label$ || just('Button'),
    classNames$: sources.classNames$ || just([]),
    disabled$: sources.disabled$ || just(false),
  }

  const click$ = sources.DOM.select('.' + id).events('click')

  const DOM = combineLatestObj(viewState)
    .map(({label, classNames, disabled}) => span({},[
      Button({
        onClick: not(disabled),
        primary: true,
        className: [id, ...classNames].join('.'),
      }, [
        label,
      ]),
    ]))

  return {
    DOM,
    click$,
  }
}

const OkAndCancel = sources => {
  const ok = RaisedButton({...sources,
    label$: sources.okLabel$ || just('OK'),
  })
  const cancel = FlatButton({...sources,
    label$: sources.cancelLabel$ || just('Cancel'),
    disabled$: just(false),
  })

  return {
    DOM: combineLatest(ok.DOM, cancel.DOM, (...DOMs) => div({},DOMs)),
    ok$: ok.click$,
    cancel$: cancel.click$,
  }
}

export {
  RaisedButton,
  FlatButton,
  OkAndCancel,
}
