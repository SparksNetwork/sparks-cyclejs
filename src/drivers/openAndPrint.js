import {Observable} from 'rx'

export default function openAndPrintDriver(element$) {
  element$.map(element => {
    // open window
    const WinPrint = window.open('', '', 'left=0,top=0,width=800,height=900,toolbar=0,scrollbars=0,status=0') // eslint-disable-line max-len

    // give the new window all of the same head elements
    Array.from(document.head.cloneNode(true).children).forEach(node => {
      WinPrint.document.head.appendChild(node)
    })

    // Append the elements children to the new windows body
    Array.from(element.cloneNode(true).children).forEach(node => {
      WinPrint.document.body.appendChild(node)
    })

    // focus the new window
    WinPrint.focus()

    return WinPrint
  })
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
