import {Subject} from 'rx'

export default function makeOpenAndPrintDriver(rootElementSelector) {
  const stream = new Subject()

  return function openAndPrintDriver(element$) {
    element$.subscribe((element) => {
      // get the current page
      const rootElement = document.querySelector(rootElementSelector)

      // make a clone of the current element to print
      // to keep origin intact where it belongs
      const clone = element.cloneNode(element)

      // reset the classname to remove any 'hidden' class
      clone.className = 'printable'

      // rmeove the current page from document
      document.body.removeChild(rootElement)

      // add cloned element to document
      document.body.appendChild(clone)

      // open print dialogue - this is blocking
      window.print()

      // remove clone from document
      document.body.removeChild(clone)

      // put back the original page
      document.body.appendChild(rootElement)

      // push into dummy stream
      stream.onNext(null)
    })

    return stream
  }
}
