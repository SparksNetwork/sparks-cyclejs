import {Observable} from 'rx'
const {just, combineLatest} = Observable

import {
  TitledCard,
  ListItem,
  ListItemNavigating,
} from 'components/sdm'

const Instructions = sources => ListItem({...sources,
  title$: just('Your application has been sent to the organizer' +
               '. You\'ll get an email when they approve you.'),
})

const ChangeApplication = sources => ListItemNavigating({...sources,
  title$: just('Edit Your Application'),
  path$: just(sources.router.createHref('/application')),
  iconName$: just('chevron-circle-right'),
})

export default sources => {
  const inst = Instructions(sources)
  const change = ChangeApplication(sources)

  const card = TitledCard({...sources,
    title$: just('Wait to be Approved.'),
    content$: combineLatest(inst.DOM, change.DOM),
  })

  const route$ = change.route$

  return {
    ...card,
    route$,
  }
}
