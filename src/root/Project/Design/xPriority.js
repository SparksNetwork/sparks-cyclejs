import {Observable} from 'rx'
const {just, merge, combineLatest} = Observable

import isolate from '@cycle/isolate'

import CreateOrganizerInvite from 'components/CreateOrganizerInvite'
import {CreateTeamListItem} from 'components/team'
import {CreateOppListItem} from 'components/opp'

import {
  ListItemNavigating,
} from 'components/sdm'

import {div} from 'helpers'

// import {log} from 'util'
import {byMatch, hideable} from 'util'

const _responseRedirects$ = ({responses$, router: {createHref}}) =>
  Observable.merge(
    responses$.filter(byMatch('Organizers','create'))
      .map(() => createHref('/manage/staff')),
    responses$.filter(byMatch('Teams','create'))
      // not createHref - /team is off root of site
      .map(response => '/team/' + response.payload),
    responses$.filter(byMatch('Opps','create'))
      // not createHref - /team is off root of site
      .map(response => '/opp/' + response.payload),
  )

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

const isMissing = prop => prop ? false : true

export default sources => {
  const needsDescription$ = sources.project$.pluck('description').map(isMissing)
  const needsPicture$ = sources.projectImage$.pluck('dataUrl').map(isMissing)
  // const needsTeam$ = sources.teams$.map(ts => ts.length > 0 ? false : true)
  // const needsOpp$ = sources.opps$.map(os => os.length > 0 ? false : true)
  const needsTeam$ = just(true)
  const needsOpp$ = just(true)
  const needsOrganizers$ = sources.organizers$.map(os => os.length > 0 ? false : true)

  const describe = isolate(DescribePriority)({...sources,
    isVisible$: needsDescription$,
  })
  const picture = isolate(PicturePriority)({...sources,
    isVisible$: needsPicture$,
  })
  const teams = isolate(TeamPriority)({...sources,
    isVisible$: needsTeam$,
  })
  const opps = isolate(OppPriority)({...sources,
    isVisible$: needsOpp$,
  })
  const orgs = isolate(StaffPriority)({...sources,
    isVisible$: needsOrganizers$,
  })
  const invite = isolate(CreateOrganizerInvite)(sources)
  // const team = isolate(CreateTeamListItem)(sources)
  // const opp = isolate(CreateOppListItem)(sources)

  const queue$ = Observable.merge(
    invite.queue$,
    // team.queue$,
    // opp.queue$,
  )

  const route$ = merge(
    // _responseRedirects$(sources),
    // sources.DOM.select('.clickable').events('click') // omg brilliant +1
    //   .filter(e => !!e.ownerTarget.dataset.link)
    //   .map(e => e.ownerTarget.dataset.link),
    describe.route$,
    picture.route$,
    teams.route$,
    opps.route$,
    orgs.route$,
  )

  const priorityDOMs = [
    describe.DOM,
    picture.DOM,
    orgs.DOM,
    teams.DOM,
    opps.DOM,
  ].filter(i => !!i)

  const DOM = combineLatest(
    ...priorityDOMs,
    (...doms) => div({}, doms)
  )

  return {DOM, queue$, route$}
}
