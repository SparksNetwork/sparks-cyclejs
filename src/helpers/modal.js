import {div, span} from 'cycle-snabbdom'
import {Col, Mask} from 'snabbdom-material'
import {material} from 'util'
import {icon} from 'helpers'

// const defaultStyles = {
//   zIndex: '1001',
//   position: 'fixed',
//   top: '0',
//   bottom: '0',
//   overflow: 'auto',
// }

// function renderSideNav(config, children) {
//   const {className = '', style: userStyle = {}} = config
//   const classes = ['sidenav', 'paper2', className].filter(Boolean)
//   const style = Object.assign(defaultStyles, userStyle, material.sidenav)
//   return div({},[
//     Mask({isOpen: true, material, className: 'close-sideNav'}),
//     div(`.${classes.join('.')}`, {style}, [
//       span({}, children),
//     ]),
//   ])
// }

// export function sideNav({isOpen, title, iconName, content, okLabel, cancelLabel}) {
//   if (isMobile && isOpen) {
//     return renderSideNav({}, [content])
//   }
//   return isMobile ? span({}, []) : div({}, [content])
// }

// const dialog = ({title, iconName, content, okLabel, cancelLabel}) =>
//   true

import {Dialog} from 'snabbdom-material'

const dialogStyle = {
  minWidth: '400px',
}

const titleStyle = {
  color: '#FFF',
  backgroundColor: '#F00',
  lineHeight: '64px',
  height: '64px',
}

const contentStyle = {
  padding: '0em 1em 1em 1em',
}

const titleRow = (iconName, title) =>
  div({style: titleStyle}, [
    Col(
      {type: 'xs-1', style: {width: '48px', 'font-size': '32px'}},
      [icon(iconName)]
    ),
    Col({type: 'xs-8'},[title]),
  ])

const modal = ({title, iconName, content, submitLabel, closeLabel}) =>
  Dialog({
    isOpen: true,
    noPadding: true,
    style: dialogStyle,
    title: titleRow(iconName, title),
    footer: span({},[
      Dialog.Button({onClick: true, primary: true, className: 'submit'},[submitLabel]),
      Dialog.Button({onClick: true, flat: true, className: 'close'},[closeLabel]),
    ]),
  },[
    div({style: contentStyle}, [content]),
  ])

  // div({},[
  //   Mask({isOpen: true, material, className: 'close'}),
  //   dialog(props),
  // ])

export default ({isOpen, ...props}) =>
  isOpen && modal(props) || null
