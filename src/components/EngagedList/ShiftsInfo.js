import { Observable as $ } from "rx"
import isolate from "@cycle/isolate"
import { div } from "cycle-snabbdom"
import { compose, of as rof, prop } from "ramda"
import { combineDOMsToDiv, mergeSinks } from "util"
import { List, ListItemHeader } from "components/sdm"
import { LoadingCollapsible } from "components/behaviors/Collapsible"

import AddShift from "./AddShift"
import ShiftItem from "./ShiftItem"
import { traceSource } from "../../trace"
const { of } = $

const ShiftsInfo = sources => {
  const addShift = isolate(AddShift)({
    ...sources,
  })
// list of shifts the user is assigned to
  // Assignments is an array of assigned shifts for a given opportunity/engagement/team
  /*
   {
   "$key": "-KKKQ4Z9a9z_kU9xxtQD",
   "endTime": "2016-07-13T17:56:06Z",
   "engagementKey": "-KGTaDXmEaMiZ9B0Xkmf",
   "oppKey": "-KEMfQuSuMoabBEy9Sdb",
   "profileKey": "-KGTaC_JGJSdekJs4fxK",
   "shiftKey": "-KJVw_QHEhftzplqBZtR",
   "startTime": "2016-07-13T10:47:21Z",
   "teamKey": "-KEMcgCK2a027JIscSfe"
   }
   */
  const rows$ = traceSource(`ShiftsInfo > ShiftItem > assignments`, sources.assignments$)

  const list = List({
    ...sources,
    Control$: of(ShiftItem), //
    rows$,
  })

  const header = LoadingCollapsible(ListItemHeader)({
    ...sources,
    title$: of('Assigned Shifts'),
    iconName$: of('calendar2'),
    rightDOM$: sources.assignments$.map(compose(div, rof, prop('length'))),
    // addShift -> list of days, list -> list of assignments?
    contentDOM$: combineDOMsToDiv('', addShift, list),
  })

  return {
    ...mergeSinks(addShift, list),
    DOM: header.DOM,
  }
}

export default ShiftsInfo
