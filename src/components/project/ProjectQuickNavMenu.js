import {Observable} from 'rx'
const {just, merge} = Observable

import isolate from '@cycle/isolate'

import {
  List,
  ListItemNavigating,
} from 'components/sdm'

import {TeamItemNavigating} from 'components/team'
import {OppItemNavigating} from 'components/opp'

import {QuickNav} from 'components/QuickNav'

const ProjectQuickNavMenu = sources => {
  const project = isolate(ListItemNavigating,'project')({...sources,
    title$: sources.project$.pluck('name'),
    path$: sources.projectKey$.map($key => '/project/' + $key),
  })

  const teams = List({...sources,
    Control$: just(TeamItemNavigating),
    rows$: sources.teams$,
  })

  const opps = List({...sources,
    Control$: just(OppItemNavigating),
    rows$: sources.opps$,
  })

  const nav = isolate(QuickNav,'quicknav')({...sources,
    label$: sources.project$.pluck('name'),
    menuItems$: just([project.DOM, teams.DOM, opps.DOM]),
  })

  return {
    DOM: nav.DOM,
    route$: merge(opps.route$, project.route$, teams.route$),
  }
}

export {ProjectQuickNavMenu}
