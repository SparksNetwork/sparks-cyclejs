import {div} from 'cycle-snabbdom'
import styles from './styles.scss'

const CenterFrame = sources => {
  const DOM = sources.pageDOM.map(pageDOM =>
    div('.sparks-dialog', [
      div(`.${styles['interstitial-login']}`, [pageDOM]),
    ])
  )

  return {
    DOM,
  }
}

export default CenterFrame
