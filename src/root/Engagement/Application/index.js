import {Observable} from 'rx'
const {just, merge, combineLatest} = Observable

import {not} from 'ramda'

// import {log} from 'util'

import {combineDOMsToDiv} from 'util'

import {LargeCard} from 'components/sdm'

import {TitleListItem} from 'components/ui'

import {cond, both, prop, complement, always} from 'ramda'

const appTitle = cond([
  [complement(prop('isApplied')), always('Finish Your Application')],
  [both(prop('isApplied'), complement(prop('isAccepted'))), always('Awaiting Acceptance')],
  [prop('isAccepted'), always('Application Accepted')],
])

const _Title = sources => TitleListItem({...sources,
  title$: sources.engagement$.map(appTitle),
})

import {Step1} from './Step1'
import {Step2} from './Step2'

export default _sources => {
  const sources = {..._sources,
    questionAnswered$: _sources.engagement$.map(prop('answer')).map(Boolean),
    teamsPicked$: just(false),
  }

  const t = _Title(sources)
  const s1 = Step1({...sources,
    isOpen$: sources.questionAnswered$.map(not),
  })
  const s2 = Step2({...sources,
    isOpen$: sources.questionAnswered$,
  })

  const card = LargeCard({...sources,
    content$: combineLatest(t.DOM, s1.DOM, s2.DOM),
  })

  return {
    DOM: combineDOMsToDiv('.cardcontainer',card),
    queue$: merge(s1.queue$, s2.queue$),
    route$: merge(s2.route$),
  }
}
