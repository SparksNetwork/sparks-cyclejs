import {Observable} from 'rx'
const {combineLatest} = Observable

import {div, icon} from 'helpers'

import {
  ListItemNavigating,
} from 'components/sdm'

const ToDoListItem = sources => {
  const leftDOM$ = sources.isDone$.map(isDone =>
      div({},[
        isDone ?
        icon('check_box','disabled') :
        icon('chevron-circle-right', 'accent'),
      ])
    )

  const li = ListItemNavigating({...sources,
    leftDOM$,
    classes$: sources.isDone$.map(isDone => ({disabled: isDone})),
  })

  const route$ = combineLatest(li.route$, sources.isDone$,
    (route, isDone) => isDone ? false : route
  ).filter(Boolean)

  return {
    ...li,
    route$,
  }
}

export {ToDoListItem}
