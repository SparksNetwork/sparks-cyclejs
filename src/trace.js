import { mapObjIndexed} from "ramda"

// DOM: traceDOMDriver(makeDOMDriver)('#root', {modules}),
function traceDOMDriver(makeDOMDriver) {
  return function traceDOMDriver(rootSelector, { modules }) {
    debugger
    const DOMDriverFn = makeDOMDriver(rootSelector, { modules })
    const tracedDOMDriverFn = function tracedDOMDriver(view$) {
      const DOMDriverOutput = DOMDriverFn(view$);
      const elementSelectorFn = DOMDriverOutput.select
      const eventsSelectorFn = DOMDriverOutput.events

      // TODO : trace also events
      return {
        observable: DOMDriverOutput.observable,
        namespace: DOMDriverOutput.namespace,
        select: traceElementSelectorFn(DOMDriverOutput, elementSelectorFn, rootSelector),
//        select: traceElementSelector.bind(elementSelectorFn),
        events: tracedEventsSelectorFn(DOMDriverOutput, eventsSelectorFn, rootSelector),
        dispose: DOMDriverOutput.dispose,
        isolateSource: DOMDriverOutput.isolateSource,
        isolateSink: DOMDriverOutput.isolateSink
      }
    }

    return tracedDOMDriverFn.bind(DOMDriverFn);
  }
}

function traceElementSelectorFn(bindObj, elementSelectorFn, rootSelector) {
  return function traceElementSelectorFn(selector) {
    debugger
    const elementSelectorOutput = elementSelectorFn.bind(bindObj)(selector)
    const eventsSelectorFn = elementSelectorOutput.events
    const elementSelectorFn2 = elementSelectorOutput.select

    // TODO : trace also select
    return {
      observable: elementSelectorOutput.observable,
      namespace: elementSelectorOutput.namespace,
      select: traceElementSelectorFn(elementSelectorOutput, elementSelectorFn2, rootSelector),
//      select: elementSelectorOutput.select,
      events: tracedEventsSelectorFn(elementSelectorOutput, eventsSelectorFn, rootSelector),
//            events: tracedEventsSelectorFn.bind(eventsSelectorFn),
      isolateSource: elementSelectorOutput.isolateSource,
      isolateSink: elementSelectorOutput.isolateSink
    }
  }
}

function tracedEventsSelectorFn(bindObj, eventsSelectorFn, rootSelector) {
  return function tracedEventsSelectorFn(type) {
    debugger
    const event$ = eventsSelectorFn.bind(bindObj)(type)

    return event$
      .tap(console.log.bind(console, `For root selector ${rootSelector}, emitting ${type} event:`))
  }
}

function traceRouterDriver(makeRouterDriver){
  return function(history){
    const routerDriver = makeRouterDriver(history)

    return function traceRouterDriver(sink$) {
      return routerDriver(sink$.tap(traceRoute))
    }
  }
}

function traceRoute(route){
  console.log(`Route sink receives ${route}`)
}

function traceSinks(header, sinks) {
  return mapObjIndexed((sink$, sinkName) => {
    return sink$.subscribe
      ? sink$.tap(console.debug.bind(console, `${header} > ${sinkName} sink`))
      // not an observable but probably an object, leave as is
      : sink$
  }, sinks)
}

// example
//   const rows$ = traceSource(`ShiftsInfo > ShiftItem > assignments`, sources.assignments$)
function traceSource(header, source$) {
    return source$.subscribe
      ? source$.tap(console.debug.bind(console, `${header} source`))
      // not an observable but probably an object, leave as is
      : source$
}

export { traceDOMDriver, traceRouterDriver, traceSinks, traceSource }
