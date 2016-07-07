import {Observable} from 'rx'
import {a, img} from 'cycle-snabbdom'
import src from 'images/sn-logo-48.png'

export default () => ({
  DOM: Observable.just(
    a({props: {href: '/dash'}}, [
      img({
        style: {height: '24px', float: 'left'},
        attrs: {src: '/' + src},
      }),
    ])
  ),
})
