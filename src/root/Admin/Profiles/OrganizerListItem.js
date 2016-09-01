import {
  always, applySpec, compose, ifElse, join, path, prop,
} from 'ramda'
import {ListItem} from 'components/sdm'
import {Navigatable} from 'components/behaviors'

export const OrganizerListItem = sources => {
  return Navigatable(ListItem)({
    ...sources,
    title$: sources.item$
      .map(path(['project', 'name'])),
    subtitle$: sources.item$
      .map(ifElse(prop('isAccepted'), always('Accepted'), always('Invited'))),
    path$: sources.item$
      .map(compose(join(''), applySpec([
        always('/project/'),
        prop('projectKey'),
      ]))),
  })
}

