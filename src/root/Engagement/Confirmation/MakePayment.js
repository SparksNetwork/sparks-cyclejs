import braintree from 'braintree-web'

import {Observable as $, Subject} from 'rx'
import {h, div} from 'cycle-snabbdom'

import {
  Engagements,
} from 'components/remote'

const MakePayment = sources => {
  const clientToken$ = sources.engagement$.map(eng => {
    if (eng.payment) { return eng.payment.clientToken }
    return eng.paymentClientToken
  })

  const paymentNonce$ = new Subject()
  const queue$ = paymentNonce$
    .withLatestFrom(
      sources.engagementKey$,
      (paymentNonce, key) => ({key, values: {paymentNonce}})
    )
    .map(Engagements.action.pay)

  const isPaying$ = sources.engagement$.map(eng => eng.isPaying)
  const isClicked$ = queue$.map(() => true).startWith(false)
  const viewState$ = $.combineLatest(clientToken$, isPaying$, isClicked$)

  const paymentForm = (clientToken, isClicked) =>
    h('form',{style: {marginBottom: '1em'}}, [
      div('#braintree', {
        hook: {
          insert: () => braintree.setup(clientToken,'dropin',{
            container: 'braintree',
            onPaymentMethodReceived: obj => paymentNonce$.onNext(obj.nonce),
            onReady: () => {
              document.getElementById('payment-submit')
                .style.display = 'inline-block'
              document.getElementById('payment-loading')
                .style.display = 'none'
            },
          }),
        },
      }),
      h('div#payment-loading', ['Loading...']),
      isClicked ?
        div('Please wait...') :
        h(`button#payment-submit.waves-button.waves-float.waves-light.waves-effect`, // eslint-disable-line max-len
          {
            attrs: {
              type: 'submit',
              disabled: isClicked,
            },
            style: {fontSize: '16px', lineHeight: '36px',
              padding: '0 24px', textAlign: 'center',
              backgroundColor: 'rgb(0,150,136)', color: '#FFF',
              display: 'none',
            },
          },
          ['Pay With This']
        ),
    ])

  const paymentNotification = () =>
    div('.list-item',[div('.content', 'Your payment has been submitted. Please wait...')])

  return {
    DOM: viewState$.map(([clientToken, isPaying, isClicked]) =>
      isPaying ?
        paymentNotification() :
        paymentForm(clientToken, isClicked)
    ),
    queue$,
  }
}

export default MakePayment
