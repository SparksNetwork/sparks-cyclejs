import {Navigatable} from 'components/behaviors'
import {
  always, applySpec, compose, join, pathOr, prop, propOr,
} from 'ramda'
import {div} from 'cycle-snabbdom'

export const TeamListItem = sources => {
  const li = sources => {
    const ass$ = sources.item$

    const DOM = ass$.map(ass =>
      div('.list-item', [
        div('.content-xcol-sm-4', [
          div('.title', pathOr('err', ['team', 'name'], ass)),
          div('.subtitle', 'Team'),
        ]),
        div('.content-xcol-sm-4', [
          div('.title', propOr('no time', 'startTime', ass)),
          div('.subtitle', 'Start Time'),
        ]),
        div('.content-xcol-sm-4', [
          div('.title', propOr('no time', 'endTime', ass)),
          div('.subtitle', 'End Time'),
        ]),
      ])
    )

    return {DOM}
  }

  return Navigatable(li)({
    ...sources,
    path$: sources.item$
      .map(compose(join(''), applySpec([
        always('/team/'),
        prop('teamKey'),
      ]))),
  })
}
