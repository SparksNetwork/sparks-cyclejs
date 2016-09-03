export const codeTitles = {
  help: ({who}) => 'To help ' + who,
  ticket: ({ticketType}) => 'A ' + ticketType + ' ticket',
  tracked: ({count, description}) => count + ' ' + description,
  schwag: ({what}) => what,
  waiver: ({who}) => 'A waiver for ' + who,
  deposit: ({amount}) => `Commit to an accountability payment of ${amount}`,
  payment: ({amount, what}) => `A payment of ${amount} when `,
  shifts: ({count}) => 'Work ' + count + ' shifts',
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
    'A ' + retailValue + ' retail value.' :
    null,
  tracked: ({allocationRule}) => allocationRule || null,
  deposit: () => 'This will only be charged if you arrive at the event but do not complete your shifts.',
  payment: ({discount}) =>
    discount ?
    `A ${discount} discount` :
    null,
  shifts: ({minLength, maxLength}) =>
    minLength && maxLength ?
    `(from ${minLength} to ${maxLength} hours each)` :
    null,
}

export {
  CommitmentItem,
  CommitmentList,
  CommitmentItemPassive,
} from './CommitmentList'
