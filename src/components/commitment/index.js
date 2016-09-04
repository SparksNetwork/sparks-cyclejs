export const codeTitles = {
  help: ({who}) => 'To help ' + who,
  ticket: ({ticketType}) => ticketType,
  tracked: ({count, description}) => count + ' ' + description,
  schwag: ({what}) => what,
  waiver: ({who}) => 'A waiver for ' + who,
  deposit: ({amount}) => `Commit to an accountability payment of $${amount}`,
  payment: ({amount}) => `A nonrefundable payment of $${amount}`,
  shifts: ({count}) => `Work ${count} ${count > 1 ? 'shifts' : 'shift'}`,
}

export const codePriority = {
  help: 1,
  ticket: 2,
  tracked: 3,
  schwag: 4,
  waiver: 4,
  deposit: 3,
  payment: 2,
  shifts: 1,
}

export const codeSubtitles = {
  ticket: ({retailValue}) =>
    retailValue ?
    `A $${retailValue} retail value.` :
    null,
  tracked: ({allocationRule}) => allocationRule || null,
  deposit: () => 'This will only be charged if you arrive at the event but do not complete your shifts.',
  payment: () => 'Paid upon confirmation, no payment needed to apply.',
  shifts: ({count, minLength, maxLength}) =>
    minLength && maxLength ?
    `From ${minLength} to ${maxLength} hours${count > 1 ? ' each' : ''}.` :
    null,
}

export {
  CommitmentItem,
  CommitmentList,
  CommitmentItemPassive,
} from './CommitmentList'
