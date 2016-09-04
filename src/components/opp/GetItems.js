import {Observable} from 'rx'
const {just} = Observable

import codeIcons from 'components/opp/codeIcons'
import {Form, makeMenuItemFormPopup} from 'components/ui'
import {InputControl} from 'components/sdm'

// SCHWAG

const SchwagWhatInput = sources => InputControl({
  label$: just('What will they get?'),
  ...sources,
})

const GetSchwagForm = sources => Form({...sources,
  Controls$: just([{field: 'what', Control: SchwagWhatInput}]),
})

export const GetSchwag = makeMenuItemFormPopup({
  FormControl: GetSchwagForm,
  title: 'Cool Schwag',
  iconName: codeIcons['schwag'],
  className: 'schwag',
})

// TRACKED

const TrackedCountInput = sources => InputControl({
  label$: just('How many are they getting?'),
  ...sources,
})

const TrackedDescriptionInput = sources => InputControl({
  label$: just('What are they getting?'),
  ...sources,
})

const TrackedAllocationRuleInput = sources => InputControl({
  label$: just('How and when are they getting this thing?'),
  ...sources,
})

const GetTrackedForm = sources => Form({
  Controls$: just([
    {field: 'count', Control: TrackedCountInput},
    {field: 'description', Control: TrackedDescriptionInput},
    {field: 'allocationRule', Control: TrackedAllocationRuleInput},
  ]),
  ...sources,
})

export const GetTracked = makeMenuItemFormPopup({
  FormControl: GetTrackedForm,
  title: 'Tracked consumables',
  iconName: codeIcons['tracked'],
  className: 'tracked',
})

// TICKET

const TicketTypeInput = sources => InputControl({
  label$: just('What ticket or pass are your volunteers receiving?'),
  ...sources,
})

const TicketRetailValueInput = sources => InputControl({
  label$: just('What is the total retail value of this ticket?'),
  ...sources,
})

const GetTicketForm = sources => Form({
  Controls$: just([
    {field: 'ticketType', Control: TicketTypeInput},
    {field: 'retailValue', Control: TicketRetailValueInput},
  ]),
  ...sources,
})

export const GetTicket = makeMenuItemFormPopup({
  FormControl: GetTicketForm,
  title: 'A Ticket or pass to an event',
  iconName: codeIcons['ticket'],
  className: 'ticket',
})

// HELP

const HelpWhoInput = sources => InputControl({
  label$: just('Who or what are they helping?'),
  ...sources,
})

const GetHelpForm = sources => Form({
  Controls$: just([{field: 'who', Control: HelpWhoInput}]),
  ...sources,
})

export const GetHelp = makeMenuItemFormPopup({
  FormControl: GetHelpForm,
  title: 'To help a community',
  iconName: codeIcons['help'],
  className: 'help',
})
