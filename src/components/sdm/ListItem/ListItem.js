import {Observable as $} from 'rx'
import combineLatestObj from 'rx-combine-latest-obj'

import {div, a} from 'cycle-snabbdom'
import {Icon} from 'components/sdm/icon'
import {filterTruth} from 'util'

const liClasses = {'list-item': true}

const contentClass = (...doms) =>
  '.content.xcol-sm-' +
  (12 - filterTruth(doms).length)

const listItemLink = ({url, leftDOM, title, subtitle, rightDOM, classes}) =>
  a({class: {...liClasses, ...classes, clickable: true},
    attrs: {href: url, target: '_new'},
  }, filterTruth([
    leftDOM && div('.left.xcol-sm-1', [leftDOM]),
    div(contentClass(leftDOM,rightDOM), filterTruth([
      div('.title', [title]),
      subtitle && div('.subtitle', [subtitle]),
    ])),
    rightDOM && div('.right.xcol-sm-1',[rightDOM]),
  ]))

const listItem = ({leftDOM, title, subtitle, rightDOM, classes}) =>
  div({class: {...liClasses, ...classes}}, filterTruth([
    leftDOM && div('.left.xcol-sm-1', [leftDOM]),
    div(contentClass(leftDOM,rightDOM), filterTruth([
      div('.title', [title]),
      subtitle && div('.subtitle', [subtitle]),
    ])),
    rightDOM && div('.right.xcol-sm-1',[rightDOM]),
  ]))

export const ListItem = sources => {
  const viewState = {
    classes$: sources.classes$ || $.just({}),
    leftDOM$: sources.leftDOM$ || Icon(sources).DOM || $.just(null),
    title$: sources.title$ || $.just(''),
    subtitle$: sources.subtitle$ || $.just(null),
    rightDOM$: sources.rightDOM$ || $.just(null),
    isVisible$: sources.isVisible$ || $.just(true),
  }

  const DOM = combineLatestObj(viewState)
    .map(({isVisible, leftDOM, title, subtitle, rightDOM, classes}) =>
      div({},[isVisible && listItem({ //need extra div for isolate
        title,
        subtitle,
        rightDOM,
        leftDOM,
        classes,
      }) || null])
    )

  return {
    DOM,
  }
}

export const ListItemNewTarget = sources => { // eslint-disable-line complexity
  const viewState = {
    classes$: sources.classes$ || $.just({}),
    url$: sources.url$ || $.just('/'),
    leftDOM$: sources.leftDOM$ || Icon(sources).DOM || $.just(null),
    title$: sources.title$ || $.just(''),
    subtitle$: sources.subtitle$ || $.just(null),
    rightDOM$: sources.rightDOM$ || $.just(null),
    isVisible$: sources.isVisible$ || $.just(true),
  }

  const DOM = combineLatestObj(viewState)
    .map(({url, isVisible, leftDOM, title, subtitle, rightDOM, classes}) =>
      div({},[isVisible && listItemLink({ //need extra div for isolate
        url,
        title,
        subtitle,
        rightDOM,
        leftDOM,
        classes,
      }) || null])
    )

  return {
    DOM,
  }
}
