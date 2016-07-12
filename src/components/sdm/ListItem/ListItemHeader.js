import {Observable as $} from 'rx'
import {icon} from 'helpers'

import {ListItem} from './ListItem'
import {Loader} from 'components/ui'

export const ListItemHeader = sources =>
  ListItem({...sources, classes$: $.just({header: true})})

export const ListItemLoadingHeader = sources => ListItem({
  classes$: $.just({header: true}),
  title$: sources.title$,
  leftDOM$: sources.watch$.startWith(true).map(false)
    .map(showl =>
      showl ?
        Loader({
          ...sources,
          visible$: sources.watch$.startWith(true).map(false),
        }).DOM :
        (sources.iconName$ || $.just('none')).map(icon)
    )
    .switch(),
})
