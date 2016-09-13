require('./styles.scss')

import {Observable} from 'rx'
const {just, combineLatest, merge, never} = Observable

import {icon, div} from 'helpers'

import {
  Menu,
} from 'components/sdm'

const HeaderClickable = sources => ({
  click$: sources.DOM.select('.nav').events('click'),
  DOM: sources.label$.map(l => div('.nav',[l])),
})

const QuickNav = sources => {
  const item = HeaderClickable({...sources,
    label$: sources.label$.map(name =>
      div({},[name, icon('caret-down')])
    ),
  })

  // const isOpen$ = item.click$.map(true).startWith(false)
  const isOpen$ = merge(
    item.click$.map(true),
    sources.isOpen$ || never(),
  ).startWith(false)


  const children$ = sources.menuItems$ || just([])

  const menu = Menu({
    ...sources,
    isOpen$,
    children$,
  })

  const DOM = combineLatest(
    item.DOM, menu.DOM,
    (...doms) => div('.quick-nav',doms)
  )

  return {
    DOM,
  }
}

export {QuickNav}
