import {Observable} from 'rx'
const {just, combineLatest} = Observable

import isolate from '@cycle/isolate'
import {div, icon, iconSrc} from 'helpers'

import {
  List,
  ListItem,
  ListItemNavigating,
  ListItemClickable,
  ListItemCollapsibleTextArea,
} from 'components/sdm'

import {Opps, Fulfillers} from 'components/remote'

import {
  TeamImages,
} from 'components/remote'

const TextareaQuestion = sources => ListItemCollapsibleTextArea({
  ...sources,
  title$: just('You can ask people one special question when they apply.'),
  iconName$: just('playlist_add'),
  okLabel$: just('this sounds great'),
  cancelLabel$: just('hang on ill do this later'),
})

const TeamIcon = sources => ({
  DOM: sources.key$
    .flatMapLatest(key => TeamImages.query.one(sources)(key))
    .map(i => i && i.dataUrl && iconSrc(i.dataUrl) || icon('power')),
})

const TeamFulfillerLookup = sources => ({
  fulfiller$: sources.fulfillers$.combineLatest(
    sources.key$,
    (fulfillers, key) =>
      fulfillers.find(({$key, teamKey}) => key === teamKey ? $key : false)
  ),
})

// const fulfillerByTeam$$ = (sources, key) =>
//   sources.fulfillers$.map(fulfillers =>
//     fulfillers.find(({$key, teamKey}) => key === teamKey ? $key : false)
//   )

const TeamFulfillerHeader = sources => ListItem({
  classes$: just({header: true}),
  title$: just('allowed teams'),
  rightDOM$: sources.fulfillers$.combineLatest(
    sources.rows$,
    (fulfillers, rows) => `${fulfillers.length}/${rows.length}`
  ),
})

const GetStartedItem = sources => ListItemNavigating({...sources,
  title$: just('Add a Team'),
  iconName$: just('group_add'),
  subtitle$: just('Once you have Teams, you\'ll be able to add them here.'),
})

const HelpItem = sources => ListItem({...sources,
  title$: just('What Teams can these Volunteers apply for?'),
})

const CheckboxControl = sources => ({
  DOM: sources.value$.map(v =>
    v ?
    icon('check_box','accent') :
    icon('check_box_outline_blank')
  ),
})

const TeamFulfilledListItem = sources => {
  const key$ = sources.item$.pluck('$key')
  const fulfiller$ = TeamFulfillerLookup({...sources, key$}).fulfiller$
  const cb = CheckboxControl({...sources, value$: fulfiller$})

  const li = ListItemClickable({...sources,
    leftDOM$: TeamIcon({...sources,key$}).DOM,
    title$: sources.item$.pluck('name'),
    rightDOM$: cb.DOM,
  })

  const queue$ = fulfiller$
    .sample(li.click$)
    .combineLatest(
      key$,
      // sources.teamKey$,
      sources.oppKey$,
      (fulfiller, teamKey, oppKey) => fulfiller && fulfiller.$key ?
        Fulfillers.action.remove({key: fulfiller.$key}) :
        Fulfillers.action.create({values: {teamKey, oppKey}}),
    )

  return {
    DOM: li.DOM,
    queue$,
  }
}

const TeamFulfilledList = sources => {
  const header = TeamFulfillerHeader(sources)
  const start = GetStartedItem(sources)
  const help = HelpItem(sources)

  const list = List({...sources,
    Control$: just(TeamFulfilledListItem),
  })

  const DOM = sources.rows$.combineLatest(
    start.DOM,
    header.DOM,
    help.DOM,
    list.DOM,
    (rows, startDOM, ...restDOM) =>
      div({}, rows.length > 0 ? restDOM : [startDOM]),
  )

  return {
    DOM,
    queue$: list.queue$,
  }
}

export default sources => {
  const fulfillers$ = sources.oppKey$
    .flatMapLatest(Fulfillers.query.byOpp(sources))

  const flist = TeamFulfilledList({...sources,
    rows$: sources.teams$,
    fulfillers$: fulfillers$,
  })

  const textareaQuestion = isolate(TextareaQuestion)({...sources,
    value$: sources.opp$.pluck('question'),
  })

  const updateQuestion$ = textareaQuestion.value$
    .withLatestFrom(sources.oppKey$, (question,key) =>
      Opps.action.update({key, values: {question}})
    )

  const queue$ = Observable.merge(
    updateQuestion$,
    flist.queue$,
  )

  const DOM = combineLatest(
    textareaQuestion.DOM,
    flist.DOM,
    (...doms) => div({},doms),
  )

  return {
    DOM,
    queue$,
  }
}
