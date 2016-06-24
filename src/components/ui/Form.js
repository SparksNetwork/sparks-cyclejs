import {Observable as $} from 'rx'
const {just} = $
import {map, compose, apply, filter, all, prop, tap} from 'ramda'

import combineLatestObj from 'rx-combine-latest-obj'
import isolate from '@cycle/isolate'

import {div} from 'helpers'
// import {log} from 'util'

const pluckStartValue = (item$, field) =>
  item$ && item$.map(i => i[field]) || just(null)

const reduceControlsToObject = controls =>
  controls.reduce((a, {field,control}) =>
    field && (a[field] = control.value$) && a || a, {}
  )

const _controlSources = (field,sources) => ({...sources,
  value$: (sources.value$ ||
      sources.item$ && pluckStartValue(sources.item$, field) ||
      just({})
    )
    .merge(pluckStartValue(sources.item$, field)),
})

const Form = sources => {
  // sources.Controls$ is an array of components

  // controls$ is array of the created components (sink collections technically)
  const controls$ = sources.Controls$.map(Controls =>
    Controls.map(({field,Control}) => ({
      field,
      control: isolate(Control,field)({
        ...sources,
        value$: _controlSources(field, sources).value$,
      }),
    }))
  ).shareReplay(1) // keeps it from being pwnd every time

  // item$ gets their values$
  const item$ = controls$.flatMapLatest(controls =>
    combineLatestObj(reduceControlsToObject(controls))
  )

  const valid$ = controls$.flatMapLatest(controls =>
    $.combineLatest(...controls.map(c => c.control.valid$ || just(true)))
    .map(all(Boolean))
    .startWith(true)
  )

  //valid$.subscribe(x => console.log('valids', x))

  const DOM = controls$.map(controls =>
    div({}, controls.map(({control}) => control.DOM))
  )

  return {
    DOM,
    item$,
    valid$,
  }
}

export {Form}
