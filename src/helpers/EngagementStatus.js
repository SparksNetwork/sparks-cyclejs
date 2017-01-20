import {filter, prop} from 'ramda'

export const validΩ = prop('profileKey')

export const appliedΩ = e =>
  e.isApplied && !e.isAccepted && !e.declined && !e.isConfirmed

export const priorityΩ = e => e.isAccepted && e.priority && !e.isConfirmed
export const okΩ = e => e.isAccepted && !e.priority && !e.isConfirmed
export const neverΩ = e => !e.isAccepted && e.declined && !e.isConfirmed
export const incompleteΩ = e => !e.isApplied
export const confirmedΩ = e => e.isConfirmed

export const filterValid = filter(validΩ)
export const filterApplied = filter(appliedΩ)
export const filterPriority = filter(priorityΩ)
export const filterOK = filter(okΩ)
export const filterNever = filter(neverΩ)
export const filterIncomplete = filter(incompleteΩ)
export const filterConfirmed = filter(confirmedΩ)

export const EngagementStatus = component => sources => {
  const all$ = sources.engagements$
    .map(filterValid)
    .shareReplay(1)

  return component({
    ...sources,
    engagements$: all$,
    applied$: all$.map(filterApplied).shareReplay(1),
    priority$: all$.map(filterPriority).shareReplay(1),
    ok$: all$.map(filterOK).shareReplay(1),
    never$: all$.map(filterNever).shareReplay(1),
    confirmed$: all$.map(filterConfirmed).shareReplay(1),
    incomplete$: all$.map(filterIncomplete).shareReplay(1),
  })
}
