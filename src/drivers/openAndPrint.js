import {Observable} from 'rx'

function buildHtml(html) {
  return `
<html>
  <head>
    ${document.head.innerHTML}
  </head>
  <body>
    ${html}
  </body>
</html>
`
}

export default function openAndPrintDriver(html$) {
  html$
    .map(buildHtml)
    .subscribe(html => {
      const WinPrint = window.open('', '', 'left=0,top=0,width=800,height=900,toolbar=0,scrollbars=0,status=0') // eslint-disable-line max-len
      WinPrint.document.write(html)
      WinPrint.document.close()
      WinPrint.focus()

      // setTimeout is required for parsing of stylesheets
      setTimeout(() => {
        WinPrint.print()
        WinPrint.close()
      })
    })

  return Observable.empty()
}
