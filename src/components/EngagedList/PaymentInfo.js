import {Observable as $} from 'rx'
const {of} = $
import Collapsible from 'components/behaviors/Collapsible'
import {
  ListItem,
  ListItemHeader,
  RaisedButton,
} from 'components/sdm'
import {objOf, prop, cond, not, T, always, has, path} from 'ramda'
import {Engagements} from '../remote/index'
import {combineDOMsToDiv, lrMap, formatDate} from 'util'
import {SwitchedComponent} from 'components/SwitchedComponent'
import {cycled} from '../../helpers/cycled'

function ViewIsPaid(sources) {
  const payment$ = sources.engagement$.map(prop('payment'))

  const amountItem = ListItem({
    ...sources,
    title$: payment$
      .map(cond([
        [not, () => 'No payment'],
        [prop('paymentError'), p => `Error: ${p.paymentError}`],
        [prop('paidAt'), p =>
          `Paid $${p.amountPaid} at ${formatDate(p.paidAt)}`],
        [prop('amountPaid'), p => `Paid $${p.amountPaid}`],
        [T, () => 'No payment'],
      ])),
  })

  const txnItem = ListItem({
    ...sources,
    title$: payment$
      .map(p => `Txn ${p.transactionId}, Sub ${p.subscriptionId}`),
  })

  return {
    DOM: combineDOMsToDiv('', amountItem, txnItem),
  }
}

function ViewNotPaid(sources) {
  return ListItem({
    ...sources,
    title$: of('No payment'),
  })
}

function ViewPayment(sources) {
  return SwitchedComponent({
    ...sources,
    Component$: lrMap(sources.engagement$,
      prop('isPaid'),
      always(ViewIsPaid),
      always(ViewNotPaid),
    ),
  })
}

const ViewReclaim = cycled('click$', sources => {
  sources.click$.subscribe(x => console.log('click', x))

  const depositInfo = ListItem({
    ...sources,
    title$: sources.engagement$
      .map(e => `Agreed deposit $${e.depositAmount}`),
  })

  const reclaimButton = RaisedButton({
    ...sources,
    label$: sources.engagement$.map(eng => eng.depositAmount)
      .map(amount => `Reclaim $${amount}`),
    disabled$: sources.click$.map(always(true)).startWith(false),
  })

  const queue$ = sources.engagement$
    .map(eng => eng.$key)
    .map(objOf('key'))
    .map(Engagements.action.reclaim)
    .sample(sources.click$)

  const DOM = lrMap(sources.profile$,
    prop('isAdmin'),
    () => combineDOMsToDiv('', depositInfo, reclaimButton),
    () => depositInfo.DOM)

  return {
    DOM,
    click$: reclaimButton.click$,
    queue$,
  }
})

function ViewReclaimed(sources) {
  return ListItem({
    ...sources,
    title$: sources.engagement$
      .map(prop('depositAmount'))
      .map(a => `Reclaiming $${a}`),
    subtitle$: sources.engagement$
      .map(path(['deposit', 'billingDate']))
      .map(formatDate)
      .map(date => `Will be billed on ${date}`),
  })
}

function ViewDeposit(sources) {
  return SwitchedComponent({
    ...sources,
    Component$: lrMap(sources.engagement$,
      has('deposit'),
      always(ViewReclaimed),
      always(ViewReclaim)
    ),
  })
}

function PaymentInfo(sources) {
  const payment = ViewPayment(sources)
  const deposit = ViewDeposit(sources)

  const header = Collapsible(ListItemHeader)({
    ...sources,
    title$: of('Payment'),
    subtitle$: sources.engagement$
      .map(cond([
        [prop('isDepositPaid'), always('Deposit reclaimed')],
        [prop('isPaid'), always('Paid')],
        [T, always('Not paid')],
      ])),
    iconName$: of('banknote'),
    contentDOM$: combineDOMsToDiv('', payment, deposit),
  })

  const DOM = header.DOM
  const queue$ = deposit.queue$

  return {
    DOM,
    queue$,
  }
}

export {PaymentInfo}
