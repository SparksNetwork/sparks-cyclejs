import {createHashHistory, createHistory} from 'history'
import {
  makeAuthDriver,
  makeFirebaseDriver,
  makeQueueDriver,
} from '@sparksnetwork/cyclic-fire'
import {makeRouterDriver, supportsHistory} from 'cyclic-router'

// app root function
import Root from './root'
import SupernovaModule from 'drivers/supernova'
import {csvDriver} from 'drivers/csv'
import defaultModules from 'cycle-snabbdom/lib/modules'
import firebase from 'firebase'
import makeBugsnagDriver from 'drivers/bugsnag'
// drivers
import {makeDOMDriver} from 'cycle-snabbdom'
import makeFocusNextDriver from 'drivers/focusNext'
import makeOpenAndPrintDriver from 'drivers/openAndPrint'
import makeOpenGraphDriver from 'drivers/openGraph'
import makePrerenderDriver from 'drivers/prerender'
/* global Sparks */
import {run} from '@cycle/core'
import screenInfoDriver from 'drivers/screenInfo'

const history = supportsHistory() ?
  createHistory() : createHashHistory()

try {
  firebase.app()
} catch (err) {
  firebase.initializeApp({
    apiKey: Sparks.FIREBASE_API_KEY,
    authDomain: Sparks.FIREBASE_AUTH_DOMAIN,
    databaseURL: Sparks.FIREBASE_DATABASE_URL,
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
  openAndPrint: makeOpenAndPrintDriver('#root'),
  prerender: makePrerenderDriver(),
  openGraph: makeOpenGraphDriver(),
  csv: csvDriver,
})

if (module.hot) {
  module.hot.accept()

  module.hot.dispose(() => {
    sinks.dispose()
    sources.dispose()
  })
}
