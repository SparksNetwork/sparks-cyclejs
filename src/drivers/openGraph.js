import {
  apply, compose, forEach, toPairs, head,
} from 'ramda'

function addTag(name, content) {
  const meta = document.createElement('meta')
  meta.setAttribute('property', `og:${name}`)
  meta.setAttribute('content', content)

  head(document.getElementsByTagName('head'))
    .appendChild(meta)
}

function makeOpenGraphDriver() {
  return function openGraphDriver(input$) {
    input$.subscribe(
      compose(
        forEach(apply(addTag)),
        toPairs
      )
    )

    return {addTag}
  }
}

export default makeOpenGraphDriver
