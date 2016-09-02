import {Observable} from 'rx'

function forEach(arrayLike, f) {
  let l = arrayLike.length

  for (let i = 0; i < l; ++i) {
    f(arrayLike[i], i)
  }
}

function createPage(element) {
  // open window
  const WinPrint = window.open('', '', 'left=0,top=0,width=800,height=900,toolbar=0,scrollbars=0,status=0') // eslint-disable-line max-len

  const base = document.createElement('base')
  base.href = window.location.origin

  // give the new window all of the same head elements
  forEach(document.head.cloneNode(true).children, node => {
    WinPrint.document.head.appendChild(node.cloneNode(true))
  })

  // Append the elements children to the new windows body
  forEach(element.cloneNode(true).children, node => {
    WinPrint.document.body.appendChild(node.cloneNode(true))
  })

  // focus the new window
  WinPrint.focus()

  return WinPrint
}

export default function openAndPrintDriver(element$) {
  element$.map(createPage)
  // give time to load stylesheets
  .debounce(100)
  .subscribe(WinPrint => {
    // open the print window - blocking
    WinPrint.print()

    // close popup window when print page has closed
    WinPrint.close()
  })

  return Observable.empty()
}
