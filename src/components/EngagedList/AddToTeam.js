import {Observable as $} from 'rx'
const {of} = $
import {
  List,
  ListItemWithMenu,
} from 'components/sdm'
import AddTeamItem from './AddTeamItem'

const AddToTeam = sources => {
  const list = List({...sources,
    rows$: sources.teams$,
    Control$: of(AddTeamItem),
  })

  return {
    ...ListItemWithMenu({...sources,
      title$: of('Add to another team'),
      iconName$: of('plus-square'),
      menuItems$: of([list.DOM]),
    }),
    queue$: list.queue$,
    route$: list.route$.shareReplay(1),
  }
}

export default AddToTeam
