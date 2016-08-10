import {Observable} from 'rx'
import {events} from 'snabbdom-material'

const screenInfoDriver = () => {
  let screenInfo$ =
    Observable.create(obs => {
      events.responsive.addListener(screenInfo => {
        obs.onNext(screenInfo)
      })
    })
    .replay(null, 1)

  const disposable = screenInfo$.connect()

  screenInfo$.dispose = () => disposable.dispose()
  return screenInfo$
}

export default screenInfoDriver
