import {Observable} from 'rx'
const {just} = Observable
import {
  test,
} from 'ramda'

import {Form} from 'components/ui/Form'
import {InputControl, DateControl} from 'components/sdm'

import {importantTip} from 'helpers'

const InfoBlock = () => ({
  DOM: just(
    importantTip(`
The details below will only be shared
with organizers that you work with.
    `),
  ),
})

const present = v => typeof v === 'string' && v.length > 0
const hasAt = test(/.+@.+/)

const FullNameInput = sources =>
  InputControl({
    ...sources,
    label$: just('Your Full Name'),
    validation$: just(present),
  })

const EmailInput = sources =>
  InputControl({
    ...sources,
    label$: just('Your Email Address'),
    validation$: just(hasAt),
  })

const PhoneInput = sources =>
  InputControl({
    ...sources,
    label$: just('Your Phone Number'),
    validation$: just(present),
  })

const LocationInput = sources =>
  InputControl({
    ...sources,
    label$: just('Your location or zip (or none)'),
    validation$: just(present),
  })

const DOBInput = sources => DateControl({
  ...sources,
  label$: just('Your date of birth'),
  byline$: just('Some events may have age restrictions'),
  validation$: just(Boolean),
})

const ProfileForm = sources => Form({...sources,
  Controls$: just([
    {field: 'fullName', Control: FullNameInput},
    {Control: InfoBlock},
    {field: 'email', Control: EmailInput},
    {field: 'phone', Control: PhoneInput},
    {field: 'location', Control: LocationInput},
    {field: 'dob', Control: DOBInput},
  ]),
})

export {ProfileForm}
