import {Observable} from 'rx'
const {of, combineLatest} = Observable

import {compose, sum, map, defaultTo, pluck} from 'ramda'

import {TabbedPage} from 'components/ui'
import Overview from './Overview'
import Shifts from './Shifts'
import {Shifts as ShiftsRemote} from 'components/remote'

import {log} from 'util'

import {div} from 'cycle-snabbdom'

import {localTime} from 'util'

const fromPath = pathName => {
  const items = pathName.split('/').filter(Boolean)
  return items[4]
}

const sumPropOrZero = propName =>
  compose(sum, map(defaultTo(0)), pluck(propName))

const shiftPeopleHours =
  compose(sum, map(s => s.people * s.hours || 0))

const percent = (numerator, denominator) =>
  defaultTo(0, Math.floor(100 * numerator / denominator))

const avgHours = (h, p) =>
  defaultTo(0, Math.floor(10 * h / p) / 10)

const _Fetch = sources => {
  const shifts$ = sources.teamKey$
    .flatMapLatest(ShiftsRemote.query.byTeam(sources))
    // .tap(log('shifts$'))

  const people$ = shifts$
    .map(sumPropOrZero('people'))

  const assigned$ = shifts$
    .map(sumPropOrZero('assigned'))

  const assignedPercent$ =
    combineLatest(assigned$, people$, percent)

  const hours$ = shifts$
    .map(shiftPeopleHours)

  const averageHoursPerShift$ =
    combineLatest(hours$, people$, avgHours)

  const shiftDates$ = shifts$
    .map(arr => arr.map(a => localTime(a.date).format('YYYY-MM-DD')))

  const selectedDate$ = sources.router.observable.pluck('pathname')
    .map(fromPath)

  const allDates$ = combineLatest(shiftDates$, selectedDate$)
    .tap(log('allDates$ start'))
    .map(([fmShifts,fmSelected]) => [...fmShifts, fmSelected].filter(i => !!i))
    .map(arr => arr.sort())
    .map(arr => Array.from(new Set(arr))) // orly???
    // .tap(log('allDates$ end'))
    .shareReplay(1)

  return {
    shifts$,
    shiftDates$,
    selectedDate$,
    allDates$,
    people$,
    assigned$,
    assignedPercent$,
    averageHoursPerShift$,
  }
}

const tabLabel = d => [
  div('', localTime(d).format('ddd')),
  div('', d),
]
  // [`${localTime(d).format('ddd')}`, d]
  // `${localTime(d).format('ddd')} ${d}`

const TabBuilder = sources => {
  const overview$ = of({path: '/', label: 'Overview'})
  const dateTabs$ = sources.allDates$
    .map(arr => arr.map(d => ({path: '/shifts/' + d, label: tabLabel(d)})))
    // .map(arr => arr.map(d => ({path: '/shifts/' + d, label: d})))
    .tap(log('dateTabs$'))

  const tabs$ = combineLatest(overview$, dateTabs$)
    .map(([ov,dt]) => [ov, ...dt])
    .shareReplay(1)
    .tap(log('tabs$'))

  return {tabs$}
}

export default sources => {
  const _sources = {...sources, ..._Fetch(sources)}
  const {tabs$} = TabBuilder(_sources)

  const routes$ = of({
    '/': Overview,
    '/shifts/:date': date => srcs => Shifts({...srcs, date$: of(date)}),
  })

  return {
    pageTitle: of('Schedule'),
    ...TabbedPage({..._sources, tabs$, routes$}),
  }
}
