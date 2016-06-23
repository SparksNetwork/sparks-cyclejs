import {Observable} from 'rx'
const {just} = Observable
import {test, allPass, not} from 'ramda'
import moment from 'moment'
import {InputControl} from 'components/sdm'
import {RaisedButton} from 'components/sdm'
import {combineLatestToDiv} from 'util'

export default (sources) => {
  const ic = InputControl({
    ...sources,
    label$: just('Choose a day to start adding shifts! (YYYY-MM-DD)'),
    validation$: just(allPass([
      test(/\d{4}-\d{2}-\d{2}/),
      str => moment(str, 'YYYY-MM-DD').isValid(),
    ])),
  })
  const rb = RaisedButton({
    ...sources,
    label$: just('Add Date'),
    disabled$: ic.valid$.map(not),
  })

  const route$ = ic.value$
    .sample(rb.click$)
    .combineLatest(
      sources.teamKey$,
      (date, team) => `/team/${team}/schedule/shifts` + (date ? `/${date}` : '')
    )
  return {
    DOM: combineLatestToDiv(ic.DOM, rb.DOM),
    route$,
  }
}
