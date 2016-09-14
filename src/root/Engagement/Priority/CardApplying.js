import {Observable} from 'rx'
const {just, merge, combineLatest} = Observable

import isolate from '@cycle/isolate'

import {
  TitledCard,
  ListItem,
} from 'components/sdm'

import {
  TitleListItem,
  ToDoListItem,
} from 'components/ui'

const Instructions = sources => ListItem({...sources,
  title$: just('Finish your application so the organizer can approve you!'),
})

const ToDoAnswer = sources => ToDoListItem({...sources,
  title$: just('Answer the application question.'),
  isDone$: sources.engagement$.map(({answer}) => !!answer),
  path$: just(sources.router.createHref('/application')),
})

const ToDoTeams = sources => ToDoListItem({...sources,
  title$: just('Choose the Teams you want to be in.'),
  isDone$: sources.memberships$.map(m => m.length > 0),
  path$: just(sources.router.createHref('/application')),
})

const ToDoClickOK = sources => ToDoListItem({...sources,
  title$: just('Push the Shiny Green Button!'),
  isDone$: just(false),
  path$: just(sources.router.createHref('/application')),
})

export default sources => {
  const desc = Instructions(sources)
  const tda = ToDoAnswer(sources)
  const tdt = ToDoTeams(sources)
  const tdo = ToDoClickOK(sources)

  const card = TitledCard({...sources,
    title$: just('Finish Your Application!'),
    content$: combineLatest(desc.DOM, tda.DOM, tdt.DOM, tdo.DOM),
  })

  const route$ = merge(tda.route$, tdt.route$, tdo.route$)
  route$.subscribe(r => console.log('card route', r))

  return {
    ...card,
    route$,
  }
}
