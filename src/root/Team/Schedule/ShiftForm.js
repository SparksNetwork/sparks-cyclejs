import {Observable as $} from 'rx'
const {just} = $
import {
  ifElse, allPass, flip, gt, gte, lt, sum, adjust, divide, map, match, compose,
  test, complement, slice,
} from 'ramda'

import {
  //ListItemCheckbox,
  InputControl,
} from 'components/sdm'

import {Form} from 'components/ui/Form'

const betweenExclusive = (from, to) => number =>
  allPass([
    flip(gte)(from),
    flip(lt)(to),
  ])(number)

const extractHour =
  ifElse(
    test(/\d+:\d+/),
    compose(
      sum,
      adjust(flip(divide)(60), 1),
      map(Number),
      slice(1, 3),
      match(/(\d+):(\d+)/)
    ),
    Number
  )

const isValidHours = compose(
  allPass([
    betweenExclusive(0, 24),
    complement(isNaN),
  ]),
  extractHour
)

const StartsInput = sources => InputControl({
  ...sources,
  label$: $.of('Starts At Hour (24 hour)'),
  validation$: just(isValidHours),
  transform$: just(extractHour),
})

const HoursInput = sources => InputControl({
  ...sources,
  label$: $.of('Hours'),
  validation$: just(isValidHours),
  transform$: just(extractHour),
})

const PeopleInput = sources => InputControl({
  ...sources,
  label$: $.of('People (Number)'),
  validation$: just(flip(gt)(0)),
  transform$: just(Number),
})

// const ToggleBonus = sources => ListItemCheckbox({...sources,
//   titleTrue$: $.of('Bonus'),
//   titleFalse$: $.of('Normal'),
// })

export const ShiftForm = sources => Form({
  ...sources,
  Controls$: $.of([
    {field: 'start', Control: StartsInput},
    {field: 'hours', Control: HoursInput},
    {field: 'people', Control: PeopleInput},
    // {field: 'bonus', Control: ToggleBonus},
  ]),
})
