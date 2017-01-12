import {Engagements, Opps, Profiles, Projects} from 'components/remote'
import {always, cond, filter, has, join, map, pipe, prop, toPairs} from 'ramda'

import {List} from 'components/sdm'
import {Observable} from 'rx'
import {ProjectItem} from 'components/project'
import combineLatestObj from 'rx-combine-latest-obj'
import {div} from 'cycle-snabbdom'

const {just} = Observable

// converts an array of arrays to an array of strings
const toCsv = arr => `"${join('","', arr)}"\n`

const toRecord = ([key,vals]) => ({key, ...vals})

const toRows = pipe(toPairs, map(toRecord))

const filterOrphans = pipe(filter(has('profileKey')), filter(has('oppKey')))

const statusCode = cond([
  [prop('declined'), always('REJECTED')],
  [prop('isConfirmed'), always('CONFIRMED')],
  [prop('isAccepted'), always('ACCEPTED')],
  [prop('isApplied'), always('APPLIED')],
])

const lensFields = ({key, profile, project, opp, ...eng}) => [
  eng.profileKey,
  profile.fullName,
  profile.email,
  profile.phone,
  key,
  statusCode(eng),
  eng.amountPaid || '0.00',
  opp.projectKey,
  project.name,
  eng.oppKey,
  opp.name,
]

export default sources => {
  console.clear()

  const projects$ = Projects.query.all(sources)().shareReplay(1)

  const engagements$ = Engagements.query.all(sources)()
    .map(pipe(toRows, filterOrphans))
    .map(filter(eng => !!eng || !!eng.oppKey || !!eng.profileKey))
    .map(map(engagement => {
      const projectAndOpp$ = Opps.query.one(sources)(engagement.oppKey)
        .map(opp => {
          const project$ = projects$
            .map(filter(prj => prj.$key === opp.projectKey)) //eslint-disable-line
            .map(prjs => prjs[0] || {}) //eslint-disable-line

          return project$.map(project => ({ project, opp })) // eslint-disable-line
        })
        .switch()

      const profile$ = Profiles.query.one(sources)(engagement.profileKey)

      return Observable.combineLatest(projectAndOpp$, profile$)
        .map(([{project, opp}, profile]) =>
          ({key: engagement.$key, project, opp, profile, ...engagement}))
    }))
    .map(Observable.combineLatest)
    .switch()
    .shareReplay(1)

  const projectList = List({...sources,
    Control$: just(ProjectItem),
    rows$: projects$,
  })

  const route$ = Observable.merge(
    projectList.route$,
    Projects.redirect.create(sources).route$,
  )

  const key$ = route$.map(route => route.split('/project/')[1].trim())

  const csv$ = Observable.combineLatest(engagements$, key$)
    .map(([engagements, key]) => {
      return engagements
        .filter(engagement => engagement.opp.projectKey === key)
        .map(pipe(lensFields, toCsv))
        .join('')
    })

  const viewState = {
    listDOM$: projectList.DOM,
  }

  const DOM = combineLatestObj(viewState)
    .map(({listDOM}) => div({},[listDOM]))

  return {
    DOM,
    csv$,
  }
}
