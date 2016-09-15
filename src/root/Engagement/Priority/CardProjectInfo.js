import {Observable} from 'rx'
const {combineLatest} = Observable

import isolate from '@cycle/isolate'

import {
  LargeCard,
  ListItem,
} from 'components/sdm'

export default sources => {
  const desc = ListItem({...sources,
    title$: sources.project$.pluck('description'),
  })
  return isolate(LargeCard)({...sources,
    content$: combineLatest(desc.DOM),
  })
}
