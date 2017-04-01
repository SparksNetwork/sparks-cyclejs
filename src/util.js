import {
  complement,
  compose,
  curryN,
  filter,
  isNil,
  join,
  map,
  objOf,
  prop,
  toPairs,
  any
} from 'ramda'

import {Observable} from 'rx'
import {ReplaySubject} from 'rx'
import {div} from 'helpers'
import isolate from '@cycle/isolate'
import moment from 'moment'
const {just, combineLatest, empty} = Observable

export const PROVIDERS = {
  google: {type: 'redirect', provider: 'google', scopes: [
    'profile',
    'email',
  ]},
  facebook: {type: 'redirect', provider: 'facebook'},
  logout: {type: 'logout'},
}

export const hideable = Control => sources => {
  const ctrl = Control(sources)
  const {DOM, ...sinks} = ctrl
  return {
    DOM: sources.isVisible$.flatMapLatest(v => v ? DOM : just(div({}, [null]))),
    ...sinks,
  }
}

const joinWithoutNil = compose(
  join(''),
  filter(complement(isNil))
)

export const siteUrl = () => {
  const location = window.location

  return joinWithoutNil([
    location.protocol,
    '//',
    location.hostname,
    location.port && location.port.length > 0 ? `:${location.port}` : null,
  ])
}

export const absoluteUrl = path =>
  joinWithoutNil([siteUrl(), path])

/**
* in: {width: 78, forward: true, animal: 'moosy moose'}
* out: width=78&forward=true&animal=moosy+moose
*/
export const toQueryString = compose(
  join('&'),
  map(join('=')),
  map(map(compose(encodeURIComponent, String))),
  toPairs
)

/**
* left/right. Takes a stream and predicate. Values that match the predicate go
* to the stream passed to the left function, stream values that do not match
* the go to the right function. Left and Right should return streams which get
* merged.
*
*   const rows$ = lr(data$, data => length > 0,
*     l$ => l$.map(data => data.map(d => div(d))),
*     r$ => r$.map(() => div('no data')))
*
*/
export const lr = (stream$, predicate, left, right) =>
  Observable.merge(
    left(stream$.filter(predicate)),
    right(stream$.filter(complement(predicate)))
  )

/**
 * Takes a stream and predicate. Values that match the predicate are mapped by
 * trueMap. Values that do not are mapped by falseMap.
 *
 * @param {Stream} stream$
 * @param {(item:any)=>boolean} predicate
 * @param {(item:any)=>any} trueMap
 * @param {(item:any)=>any} falseMap
 * @returns {Stream}
 */
export const lrMap = (stream$, predicate, trueMap, falseMap) =>
  Observable.merge(
    stream$.filter(predicate).map(trueMap),
    stream$.filter(complement(predicate)).map(falseMap)
  )

export const switchStream = (stream$, predicate, left, right) =>
  stream$.flatMapLatest(item =>
    predicate(item) ? left(item) : right(item))

export const startValue = (Control, value) => sources => {
  const value$ = new ReplaySubject(1)
  value$.onNext(value)

  const ctrl = Control({...sources,
    value$,
  })

  ctrl.value$.subscribe(v => value$.onNext(v))

  return {
    ...ctrl,
    value$,
  }
}

export const localTime = t => //1p
  moment(t).utc().add(moment.parseZone(t).utcOffset(),'m')

export const formatTime = t =>
  localTime(t).format('hh:mm a')

export const formatDate = t =>
  localTime(t).format('ddd Do MMM')

export const requireSources = (cname, sources, ...sourceNames) =>
  sourceNames.forEach(n => {
    if (!sources[n]) { throw new Error(cname + ' must specify ' + n)}
  })

export const trimTo = (val, len) =>
  val.length > len ? val.slice(0,len) + '...' : val

/**
 * Take a list of streams that emit a vdom each and return a single stream that
 * emits a single vdom whose children are the emitted vdoms.
 *
 * @returns {Stream<VDOM>}
 */
export const combineLatestToDiv = (...domstreams) =>
  combineLatest(...domstreams, (...doms) => div({},doms))

/**
 * Take a list of components and return a single stream that emits a vdom where
 * the class/sel is the first argument and the vdoms emitted by each component
 * make up it's children.
 *
 * @example:
 *
 *   const card1 = Card(sources)
 *   const card2 = Card(sources)
 *   const DOM = combineDOMsToDiv('.cards', card1, card2)
 *
 * @returns {Stream<VDOM>}
 */
export const combineDOMsToDiv = (d, ...comps) =>
  combineLatest(...comps.map(c => c.DOM), (...doms) => div(d, doms))

export const controlsFromRows = curryN(3)((sources, rows, Control) => {
  if (rows.length === 0 && sources.emptyDOM$) {
    return [{DOM: sources.emptyDOM$}]
  } else {
    return rows.map((row, i) =>
      isolate(Control,row.$key)({
        ...sources,
        item$: just(row),
        index$: just(i),
      }))
  }
})

export const byMatch = (matchDomain,matchEvent) =>
  ({domain,event}) => domain === matchDomain && event === matchEvent

export const rows = obj =>
  obj ? Object.keys(obj).map(k => ({$key: k, ...obj[k]})) : []

export const log = label => emitted => console.log(label,':',emitted)

export const isObservable = obs => typeof obs.subscribe === 'function'

function pluckFlat(component, key) {
  return component.flatMapLatest(obj => obj[key] || Observable.never())
}

export function nestedComponent(match$, sources) {
  const component = match$.map(({path, value}) => {
    return value({...sources, router: sources.router.path(path)})
  }).shareReplay(1)

  component.pluckFlat = (key) => pluckFlat(component, key)

  return component
}

/**
* Get a prop from one object and rename it as a prop in a new object:
*
*   propTo('a', 'b')({a: 1}) => {b: 1}
*
* @param {Object} from from key
* @param {Object} to to key
* @param {Object} object
* @return {Object}
*/
export const propTo = curryN(3)((from, to, object) =>
  compose(objOf(to), prop(from))(object))

export const mergeOrFlatMapLatest = (property, ...sourceArray) =>
  Observable.merge(
    sourceArray.map(src => // array.map!
      isObservable(src) ? // flatmap if observable
        src.flatMapLatest(l => l[property] || Observable.empty()) :
        // otherwise look for a prop
        src[property] || Observable.empty()
    )
  )

export const mergeSinks = (...childs) => ({
  auth$: mergeOrFlatMapLatest('auth$', ...childs),
  queue$: mergeOrFlatMapLatest('queue$', ...childs),
  route$: mergeOrFlatMapLatest('route$', ...childs),
  focus$: mergeOrFlatMapLatest('focus$', ...childs),
  openAndPrint: mergeOrFlatMapLatest('openAndPrint', ...childs),
  openGraph: mergeOrFlatMapLatest('openGraph', ...childs),
  csv$: mergeOrFlatMapLatest('csv$', ...childs),
})

export const pluckLatest = (k,s$) => s$.pluck(k).switch()

export const pluckLatestOrNever = (k,s$) =>
  s$.map(c => c[k] || empty()).switch()

// app-wide material styles
export const material = {
  primaryColor: '#666',
  primaryFontColor: 'rgba(255, 255, 255, 0.9)',
  primaryFontColorDisabled: 'rgba(0, 0, 0, 0.45)',
  primaryLightWaves: false,
  secondaryColor: '#009688',
  secondaryFontColor: 'rgba(255, 255, 255, 0.9)',
  secondaryFontColorDisabled: 'rgba(255, 255, 255, 0.6)',
  secondaryLightWaves: true,
  errorColor: '#C00',
  successColor: '#090',
  typographyColor: '#212121',

  sidenav: {
    width: '280px',
    left: '-290px',
    transition: 'left .3s ease-out',
    delayed: {
      left: '0',
    },
    remove: {
      left: '-290px',
    },
  },

  fadeInOut: {
    opacity: '0',
    transition: 'opacity .3s',
    delayed: {
      opacity: '1',
    },
    remove: {
      opacity: '0',
    },
  },
}

/**
* Boolean() returns false for 0 which is dumb
*/
export const truth = val =>
  Boolean(val) || val === 0

export const filterTruth = filter(truth)

export function isShiftOverlappingWithAssignments(item, assignments) {
  return any(isShiftOverlappingWithAssignment(item), assignments)
}

function isShiftOverlappingWithAssignment(item) {
  return function isShiftOverlappingWithAssignment(assignment) {
    return isTimeOverlapping(
      { start: item.start, end: item.end },
      { start: assignment.startTime, end: assignment.endTime }
    )
  }
}

function isTimeOverlapping(time1, time2) {
  const start1 = Date.parse(time1.start)
  const start2 = Date.parse(time2.start)
  const end1 = Date.parse(time1.end)
  const end2 = Date.parse(time2.end)

  return isInBetween(start2, start1, end1) ||
    isInBetween(start1, start2, end2) ||
    isInBetween(end1, start2, end2) ||
    isInBetween(end2, start1, end1)
}

function isInBetween(start2, start1, end1) {
  return start2 > start1 && start2 < end1
}
