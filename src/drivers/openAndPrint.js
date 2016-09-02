import {Observable} from 'rx'

const STYLESHEET = window.location.origin + '/scss/styles.css'

function buildHtml(html) {
  return Observable
    .fromPromise(fetch(STYLESHEET).then(res => res.text()))
    .map((stylesheet) =>
      Array.prototype.slice.call(document.querySelectorAll('style'))
        .map(style => style.innerHTML)
        .reduce((a, b) => a + b, stylesheet)
    )
    .map(styles => `
      <html>
        <head>
          <style>
            ${styles}
          </style>
        </head>
        <body>
          ${html}
        </body>
      </html>
      `
    )
}

export default function openAndPrintDriver(html$) {
  html$
    .map(buildHtml)
    .switch()
    .map(html => {
      const WinPrint = window.open('', '', 'left=0,top=0,width=800,height=900,toolbar=0,scrollbars=0,status=0') // eslint-disable-line max-len
      WinPrint.document.write(html)
      WinPrint.focus()

      return WinPrint
    })
    .debounce(50)
    .subscribe(WinPrint => {
      WinPrint.print()
      WinPrint.close()
    })

  return Observable.empty()
}
