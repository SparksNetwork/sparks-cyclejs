import {Observable as $} from 'rx'
const {just} = $
import {
  join, juxt, last, init, split, toLower, prop, sortBy, compose, propOr,
} from 'ramda'

import {
  Arrivals,
  Assignments,
  Engagements,
  Opps,
  Organizers,
  Profiles,
  Projects,
  Teams,
} from 'components/remote'

const fullNameToSortName = compose(
  join(' '),
  juxt([last, init]),
  split(' '))

const sortBySurname = sortBy(
  compose(
    toLower,
    fullNameToSortName,
    propOr('', 'fullName')
  ))

export function OrganizersFetcher(sources) {
  const profile$ = sources.profile$

  const fetchOrgProject = org =>
    Projects.query.one(sources)(org.projectKey)
      .map(project =>
        ({...org, project})
      )

  const fetchOrgsProjects = orgs =>
    orgs.length === 0 ? just([]) :
      $.combineLatest(...orgs.map(fetchOrgProject))

  const organizers$ = profile$
    .map(prop('$key'))
    .flatMapLatest(Organizers.query.byUser(sources))
    .map(fetchOrgsProjects)
    .switch()
    .shareReplay(1)

  return organizers$
}

export function EngagementsFetcher(sources) {
  const oneOpp = Opps.query.one(sources)
  const oneProj = Projects.query.one(sources)

  const profile$ = sources.profile$

  const fetchEngOpp = eng =>
    oneOpp(eng.oppKey)
      .map(opp =>
        oneProj(opp.projectKey)
        .map(project =>
          ({...eng, opp, project})
        )
      )
      .switch()

  const fetchEngagementsOppsAndProjects = engs =>
    engs.length === 0 ? just([]) :
      $.combineLatest(...engs.map(fetchEngOpp))

  const engagements$ = profile$
    .map(prop('$key'))
    .flatMapLatest(Engagements.query.byUser(sources))
    .map(fetchEngagementsOppsAndProjects)
    .switch()
    .shareReplay(1)

  return engagements$
}

export function AssignmentsFetcher(sources) {
  const engAss = Assignments.query.byEngagement(sources)
  const oneTeam = Teams.query.one(sources)
  const engagement$ = sources.engagement$

  const fetchAssTeam = ass =>
    oneTeam(ass.teamKey)
      .map(team =>
        ({...ass, team})
      )

  const fetchAssTeams = asses =>
    asses.length === 0 ? just([]) :
      $.combineLatest(...asses.map(fetchAssTeam))

  return engagement$
    .map(prop('$key'))
    .map(engAss)
    .switch()
    .map(fetchAssTeams)
    .switch()
    .shareReplay(1)
}

export function ArrivalsFetcher(sources) {
  const profArr = Arrivals.query.byProfile(sources)
  const oneProj = Projects.query.one(sources)

  const fetchProject = arr =>
    oneProj(arr.projectKey)
      .map(project =>
        ({...arr, project})
      )

  const fetchProjects = arrs =>
    arrs.length === 0 ? just([]) :
      $.combineLatest(...arrs.map(fetchProject))

  return sources.profile$
    .map(prop('$key'))
    .map(profArr)
    .switch()
    .map(fetchProjects)
    .switch()
    .shareReplay(1)
}

export const ProfilesFetcher = component => sources => {
  const profiles$ = Profiles.query.all(sources)()
    .map(sortBySurname)
    .shareReplay(1)

  return component({
    ...sources,
    profiles$,
  })
}

export const ProfileFetcher = component => sources => {
  const profile$ = sources.key$.flatMapLatest(Profiles.query.one(sources))

  return component({
    ...sources,
    profile$,
  })
}
