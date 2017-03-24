import { Observable as $ } from "rx"
import { ListItem } from "./ListItem"

export const ListItemClickable = sources => {
  const classes$ = (sources.classes$ || $.just({}))
    .map(setClickableAttribute)

  const click$ = sources.classes$
    ? sources.classes$.flatMap(classes =>
      classes.disabled
        ? $.empty()
        : sources.DOM.select('.list-item').events('click')
    )
    : sources.DOM.select('.list-item').events('click')


  return {
    DOM: ListItem({ ...sources, classes$ }).DOM,
    click$,
  }
}

function setClickableAttribute(classes) {
  return classes.disabled
    ? classes
    : { clickable: true, ...classes }
}
