import {Observable as $, ReplaySubject} from 'rx'
const {just} = $
import {
  addIndex, all, always, applySpec, compose, filter, identity, map,
  range,
} from 'ramda'
import moment from 'moment'
import isolate from '@cycle/isolate'

import {div, label, span} from 'cycle-snabbdom'

import {SelectControl} from './SelectControl'
import './DateControl.scss'

/**
* @param {number} from
* @param {number} to
* @return {array}
*/
const rangeOptions = compose(
  map(applySpec({label: identity, value: identity})),
  range
)

// Array of month names
const monthsShort = moment.monthsShort()
// Convert moment to array
const momentAry = m => m && [m.year(), m.month() + 1, m.date()]

/**
* A date control component which is three select boxes for the year month and
* day
*
* In:
*   - value$: number | date | string
*   - validation$: function
*   - label$: string
*   - byline$: string
*
* Out:
*   - value$: timestamp number
*   - valid$: boolean
*/
const DateControl = sources => {
  const validation$ = sources.validation$ || just(always(true))

  // Loopback from the rawValue$ stream
  const inputValue$ = new ReplaySubject()

  const year = isolate(SelectControl)({
    ...sources,
    options$: just(rangeOptions(moment().year() - 100, moment().year() - 8)),
    label$: just('Year'),
    value$: inputValue$.map(m => m && m[0]),
  })

  const month = isolate(SelectControl)({
    ...sources,
    options$: just(
      addIndex(map)((m, idx) =>
        ({...m, label: monthsShort[idx]}))(rangeOptions(1,13))
    ),
    label$: just('Month'),
    value$: inputValue$.map(m => m && m[1]),
  })

  const day = isolate(SelectControl)({
    ...sources,
    options$: just(rangeOptions(1,31)),
    label$: just('Day'),
    value$: inputValue$.map(m => m && m[2]),
  })

  // Outputs arrays of [year, month, day]
  const outputValue$ = $.combineLatest(year.value$, month.value$, day.value$)
    .filter(all(Boolean))

  // Outputs arrays of [year, month, day] coming from the inputs and from any
  // external value
  const rawValue$ = $.merge(
      (sources.value$ || just(moment())).map(momentAry),
      outputValue$
    )
    .distinctUntilChanged()
    .shareReplay(1)
  // Loop back to populate the form
  rawValue$.subscribe(inputValue$)

  // Convert the raw value to a timestamp
  const value$ = rawValue$
    .map(m => m && moment.utc().year(m[0]).month(m[1] - 1).date(m[2]))
    .map(m => m && Number(m))
    .shareReplay(1)

  // Run the validation
  const valid$ = $.combineLatest(value$, validation$)
    .map(([v, fn]) => fn(v))

  const label$ = sources.label$ || just(null)

  const inputsDOM = $.combineLatest(year.DOM, month.DOM, day.DOM)
    .map(inputs => div('.row', inputs.map(input =>
      div('.col-xs-4', [input])
    )))

  const bylineDOM = sources.byline$ || just(null)
    .map(byline => byline ? div('.byline', [byline]) : null)

  const DOM = $.combineLatest(inputsDOM, label$, bylineDOM)
    .map(([inputs, labelText, byline]) => div('.date-control', filter(Boolean, [
      div([label('.date-control-label', [span([labelText])])]),
      div([inputs]),
      byline,
    ])))

  return {
    DOM,
    value$,
    valid$,
  }
}

export {DateControl}
