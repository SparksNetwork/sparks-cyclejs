import {Observable} from 'rx'
const {just} = Observable

import {
  TitledCard,
  ListItem,
} from 'components/sdm'

const Instruct = sources => ListItem({...sources,
  title$: just('Your project is all set up!  Check out your Teams and Opportunities.'),
})

export default sources => {
  const instruct = Instruct(sources)

  const card = TitledCard({...sources,
    title$: just('Setup Your Project'),
    content$: just([
      instruct.DOM,
    ]),
  })

  return card
}
