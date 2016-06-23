import {Observable as $} from 'rx'
const {just} = $
import {always} from 'ramda'
import combineLatestObj from 'rx-combine-latest-obj'

import {div} from 'helpers'

import {Input} from 'snabbdom-material'

const InputControl = sources => {
  const input$ = sources.DOM.select('.input').events('input')
  const key$ = sources.DOM.select('.input').events('keydown')

  const value$ = (sources.value$ || just(null))
    .merge(input$.pluck('target', 'value'))

  const validation$ = sources.validation$ || just(always(true))
  const valid$ = $.combineLatest(validation$, value$)
    .map(([validation, value]) => validation(value))

  const viewState = {
    label$: sources.label$ || just(null),
    value$,
    classNames$: sources.classNames$ || just([]),
  }

  const DOM = combineLatestObj(viewState)
    .map(({label, value, classNames}) =>
      div({},[
        Input({label, value, className: ['input', ...classNames].join('.')}),
      ])
    )

  return {
    DOM,
    value$,
    valid$,
    key$,
  }
}

export {InputControl}
