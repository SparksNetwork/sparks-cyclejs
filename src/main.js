import {run} from '@cycle/core'

// drivers
import {makeDOMDriver} from 'cycle-snabbdom'
import defaultModules from 'cycle-snabbdom/lib/modules'
import SupernovaModule from 'drivers/supernova'
import {makeRouterDriver, supportsHistory} from 'cyclic-router'
import {createHistory, createHashHistory} from 'history'
import firebase from 'firebase'
import {
  makeAuthDriver, makeFirebaseDriver, makeQueueDriver,
} from '@sparksnetwork/cyclic-fire'
import screenInfoDriver from 'drivers/screenInfo'
import openAndPrintDriver from 'drivers/openAndPrint'
import makeBugsnagDriver from 'drivers/bugsnag'
import makeFocusNextDriver from 'drivers/focusNext'
import makePrerenderDriver from 'drivers/prerender'
import makeOpenGraphDriver from 'drivers/openGraph'

// app root function
import Root from './root'

const history = supportsHistory() ?
  createHistory() : createHashHistory()

try {
  firebase.app()
} catch (err) {
  firebase.initializeApp({
    apiKey: Sparks.FIREBASE_API_KEY, // eslint-disable-line
    authDomain: Sparks.FIREBASE_AUTH_DOMAIN, // eslint-disable-line
    databaseURL: Sparks.FIREBASE_DATABASE_URL, // eslint-disable-line
  })
}
const fbRoot = firebase.database().ref()

const modules = defaultModules.concat(SupernovaModule)

const {sources, sinks} = run(Root, {
  screenInfo$: screenInfoDriver,
  DOM: makeDOMDriver('#root', {modules}),
  focus$: makeFocusNextDriver(),
  router: makeRouterDriver(history),
  firebase: makeFirebaseDriver(fbRoot),
  auth$: makeAuthDriver(firebase),
  queue$: makeQueueDriver(fbRoot.child('!queue')),
  bugsnag: makeBugsnagDriver({
    releaseStage: process.env.BUILD_ENV || 'development',
  }),
  openAndPrint: openAndPrintDriver,
  prerender: makePrerenderDriver(),
  openGraph: makeOpenGraphDriver(),
})

if (module.hot) {
  module.hot.accept()

  module.hot.dispose(() => {
    sinks.dispose()
    sources.dispose()
  })
}
