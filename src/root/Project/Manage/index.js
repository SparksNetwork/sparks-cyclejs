import {Observable} from 'rx'
const {of} = Observable

import {TabbedPage} from 'components/ui'

import Arrivals from './Arrivals'
import Checkin from './Checkin'

export default sources => ({
  pageTitle: of('Manage Live'),

  ...TabbedPage({...sources,
    tabs$: of([
      {path: '/', label: 'Arrivals'},
      {path: '/checkin', label: 'Shift Checkin'},
    ]),
    routes$: of({
      '/': Arrivals,
      '/checkin': Checkin,
    }),
  }),
})
