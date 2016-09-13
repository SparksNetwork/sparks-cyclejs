import {Observable} from 'rx'
const {of} = Observable

import {TabbedPage} from 'components/ui'

import Priority from './Priority'
import Describe from './Describe'
import Staff from './Staff'

export default sources => ({
  pageTitle: of('Design'),

  ...TabbedPage({...sources,
    tabs$: of([
      {path: '/', label: 'Priority'},
      {path: '/describe', label: 'Describe'},
      {path: '/staff', label: 'Staff'},
    ]),
    routes$: of({
      '/': Priority,
      '/describe': Describe,
      '/staff': Staff,
    }),
  }),
})
