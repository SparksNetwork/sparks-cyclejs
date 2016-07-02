import {Observable as $} from 'rx'
const {just} = $
import {span} from 'cycle-snabbdom'
import {not} from 'ramda'
require('./Loader.scss')

const Loader = sources => {
  const visible$ = sources.visible$ || just(true)

  const DOM = visible$.map(visible =>
      span('.spinner.icon-spinner9', {class: {hidden: not(visible)}})
    )
    .shareReplay(1)

  return {
    DOM,
  }
}

export default Loader
