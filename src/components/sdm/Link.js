import {Observable as $} from 'rx'
import {a} from 'cycle-snabbdom'
import {NavigatableRaw} from 'components/behaviors'

export const Link = NavigatableRaw(sources => {
  const content$ = sources.content$
  const path$ = sources.path$

  const DOM = $.combineLatest(
      path$,
      content$,
    )
    .map(([href, content]) => a({attrs: {href}}, [content]))

  return {DOM}
})
