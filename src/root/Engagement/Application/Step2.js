import {Observable as $} from 'rx'

import {
  StepListItem,
} from 'components/ui'

import ChooseTeams from './ChooseTeams'

export const Step2 = sources => {
  const pt = ChooseTeams({...sources,
    isOpen$: null,
  })

  const li = StepListItem({...sources,
    title$: $.just('Step 2: Pick Some Teams'),
    contentDOM$: pt.DOM,
  })

  return {
    ...li,
    queue$: pt.queue$,
    route$: pt.route$,
  }
}
