import {Observable} from 'rx'
const {just, merge, combineLatest} = Observable

import {not} from 'ramda'
import isolate from '@cycle/isolate'

// import {log} from 'util'

import {combineDOMsToDiv} from 'util'

import {
  LargeCard,
  RaisedButton,
  ListItem,
} from 'components/sdm'

import {
  TitleListItem,
  StepListItem,
} from 'components/ui'

import {
  Engagements,
} from 'components/remote'

import {cond, both, prop, complement, always} from 'ramda'

const appTitle = cond([
  [complement(prop('isApplied')), always('Finish Your Application')],
  [
    both(prop('isApplied'), complement(prop('isAccepted'))),
    always('Awaiting Acceptance'),
  ],
  [prop('isAccepted'), always('Application Accepted')],
])

const _Title = sources => TitleListItem({...sources,
  title$: sources.engagement$.map(appTitle),
})

const appInstruct = cond([
  [complement(prop('isApplied')), always('Applying is easy! Just answer the organizer\'s question and pick which teams you\'re interested in.')], // eslint-disable-line max-len
  [both(prop('isApplied'), complement(prop('isAccepted'))), always('You\'ve sent in your application. Forget something? You can update it until it\'s approved.')], // eslint-disable-line max-len
  [prop('isAccepted'), always('You\'ve been approved, now confirm to pick your shifts and lock in your spot!')], // eslint-disable-line max-len
])

const _Instruct = sources => ListItem({...sources,
  title$: sources.engagement$.map(appInstruct),
})

import {Step1} from './Step1'
import {Step2} from './Step2'

const Step3 = sources => {
  const inst = ListItem({...sources,
    title$: just('Looking good! Send your application to the organizer by clicking the shiny, candy-like, turquoise button.'), // eslint-disable-line max-len
  })
  const rb = isolate(RaisedButton)({...sources,
    label$: just(`Send In My Application`),
  })

  const li = StepListItem({...sources,
    title$: just('Step 3: Submit Your Application'),
    contentDOM$: combineDOMsToDiv('.step3', inst, rb),
  })

  const queue$ = sources.engagementKey$
    .sample(rb.click$)
    .map(key => ({key, values: {isApplied: true}}))
    .map(Engagements.action.update)
    // .tap(q => console.log('update isApplied',q))

  const route$ = sources.engagementUrl$
    .sample(rb.click$)

  // const queue$ = rb.click$.combineLatest(
  //   sources.engagementKey$,
  //   (c,key) => ({key, values: {isApplied: true}})
  // ).map(Engagements.action.update)

  return {
    ...li,
    queue$,
    route$,
  }
}

export default _sources => {
  const sources = {..._sources,
    questionAnswered$: _sources.engagement$.map(prop('answer')).map(Boolean),
    teamsPicked$: _sources.memberships$.map(m => m.length > 0),
  }

  const t = _Title(sources)
  const i = _Instruct(sources)
  const s1 = Step1({...sources,
    isOpen$: sources.questionAnswered$.map(not),
  })
  const s2 = Step2({...sources,
    isOpen$: sources.questionAnswered$,
  })
  const s3 = Step3({...sources,
    isOpen$: sources.teamsPicked$,
  })

  const card = LargeCard({...sources,
    content$: combineLatest(t.DOM, i.DOM, s1.DOM, s2.DOM, s3.DOM),
  })

  return {
    DOM: combineDOMsToDiv('.cardcontainer',card),
    queue$: merge(s1.queue$, s2.queue$, s3.queue$),
    route$: s3.route$,
  }
}
