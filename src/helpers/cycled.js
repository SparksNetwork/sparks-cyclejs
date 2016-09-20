import {Subject} from 'rx'
import {
  last, init, compose, map, fromPairs, intersection, keys,// omit,
} from 'ramda'

/**
 * Cycle component sinks back to the component sources.
 *
 * Imagine you have a button component that takes a disabled$ stream:
 *
 *   Button({...sources, disabled$: ?})
 *
 * You want to disable the button when the button is clicked:
 *
 *   const button = Button({...sources, disabled$: button.click$})
 *
 * But this doesn't work, you don't have the click$ source yet. This function
 * let's you cycle that click$ source back to the button:
 *
 *   const DisableOnClickButton = cycled('click$', sources =>
 *     Button({
 *       ...sources,
 *       disabled$: sources.click$.map(true).startWith(false)
 *     })
 *   )
 *
 *   DisableOnClickButton({...sources})
 *
 * @param streamNames array of stream names
 * @param component
 * @returns {function(*names, component)}
 */
export function cycled(...streamNames) {
  const Component = last(streamNames)
  const names = init(streamNames)

  return sources => {
    const cycles = compose(
      fromPairs,
      map(name => [name, new Subject()])
    )(names)

    const sourcesWithCycles = {...sources, ...cycles}
    const sinks = Component(sourcesWithCycles)

    const cycledSinkNames = intersection(names, keys(sinks))
    for (let sinkName of cycledSinkNames) {
      const sink = sinks[sinkName]
      const source = cycles[sinkName]

      sink.subscribe(
        x => source.onNext(x),
        x => source.onError(x),
        x => source.onCompleted(x)
      )
    }

    return sinks
    // const sinksWithoutCycles = omit(cycledSinkNames, sinks)
    //return sinksWithoutCycles
  }
}

