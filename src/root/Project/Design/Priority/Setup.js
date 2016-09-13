import {Observable} from 'rx'
const {just, merge} = Observable

import isolate from '@cycle/isolate'

import {
  TitledCard,
  ListItem,
  ListItemNavigating,
} from 'components/sdm'

import {hideable} from 'util'

const Instruct = sources => ListItem({...sources,
  title$: just('Finish all these things to start recruiting volunteers.'),
})

const DescribePriority = sources => hideable(ListItemNavigating)({...sources,
  title$: just('What\'s your project all about?'),
  iconName$: just('playlist_add'),
  path$: just(sources.router.createHref('/describe')),
})

const PicturePriority = sources => hideable(ListItemNavigating)({...sources,
  title$: just('Choose a photo for your project'),
  iconName$: just('add_a_photo'),
  path$: just(sources.router.createHref('/describe')),
})

const TeamPriority = sources => hideable(ListItemNavigating)({...sources,
  title$: just('Add Teams to give your volunteers something to do.'),
  iconName$: just('group_add'),
  path$: just(sources.router.createHref('/teams')),
})

const OppPriority = sources => hideable(ListItemNavigating)({...sources,
  title$: just('Create an Opportunity to get volunteers to sign up.'),
  iconName$: just('power'),
  path$: just(sources.router.createHref('/opps')),
})

const StaffPriority = sources => hideable(ListItemNavigating)({...sources,
  title$: just('Invite another Organizer to help you run the project.'),
  iconName$: just('person_add'),
  path$: just(sources.router.createHref('/staff')),
})

export default sources => {
  const instruct = Instruct(sources)
  const describe = isolate(DescribePriority)({...sources,
    isVisible$: sources.needsDescription$,
  })
  const picture = isolate(PicturePriority)({...sources,
    isVisible$: sources.needsPicture$,
  })
  const teams = isolate(TeamPriority)({...sources,
    isVisible$: sources.needsTeam$,
  })
  const opps = isolate(OppPriority)({...sources,
    isVisible$: sources.needsOpp$,
  })
  const orgs = isolate(StaffPriority)({...sources,
    isVisible$: sources.needsOrganizers$,
  })

  const card = TitledCard({...sources,
    title$: just('Setup Your Project'),
    content$: just([
      instruct.DOM,
      describe.DOM,
      picture.DOM,
      teams.DOM,
      opps.DOM,
      orgs.DOM,
    ]),
  })

  const route$ = merge(
    describe.route$,
    picture.route$,
    teams.route$,
    opps.route$,
    orgs.route$,
  )

  return {
    DOM: card.DOM,
    route$,
  }
}
