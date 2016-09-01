import {Observable} from 'rx'

function buildHtml(html, style) {
  return `
  <html>
    <head>
      <style>
        ${style}
      </style>
    </head>
    <body>
      ${html}
    </body>
  </html>
  `
}

export default function openAndPrintDriver(html$) {
  const style = Array.prototype.slice.call(document.querySelectorAll('style'))
    .map(x => x.innerHTML)
    .reduce(function concatStrings(x, y) { return x + y}, '')

  html$
    .subscribe(html => {
      const WinPrint = window.open('', '', 'left=0,top=0,width=800,height=900,toolbar=0,scrollbars=0,status=0') // eslint-disable-line max-len
      WinPrint.document.write(buildHtml(html, style))
      WinPrint.document.close()
      WinPrint.focus()
      // no idea why, but all of the sudden the printed reports were f'd
      // trial and error determined that putting print/close in a timeout
      // gave browser enough time to render page correctly?
      setTimeout(function printIt() {
        WinPrint.print()
        WinPrint.close()
      },0)
    })

  return Observable.empty()
}
