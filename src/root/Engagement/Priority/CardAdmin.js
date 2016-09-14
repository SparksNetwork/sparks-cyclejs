import {Observable} from 'rx'
const {just, combineLatest} = Observable

import isolate from '@cycle/isolate'

import {
  LargeCard,
  ListItem,
  ListItemHeader,
} from 'components/sdm'

import {
  Profiles,
} from 'components/remote'

export default sources => {
  const profile$ = sources.engagement$.pluck('profileKey')
    .flatMapLatest(Profiles.query.one(sources))

  const admin = ListItemHeader({...sources,
    title$: just('Admin Info'),
  })
  const userinfo = ListItem({...sources,
    title$: profile$.pluck('fullName'),
    subtitle$: profile$.map(({email, $key}) => `${email} | ${$key}`),
  })
  return isolate(LargeCard)({...sources,
    content$: combineLatest(admin.DOM, userinfo.DOM),
  })
}
