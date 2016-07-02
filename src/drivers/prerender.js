const makePrerenderDriver = () => {
  return function prerenderDriver(input$) {
    input$.subscribe(() => {
      window.prerenderReady = true
    })

    return {
      ready: () => {
        window.prerenderReady = true
      },
    }
  }
}

export default makePrerenderDriver
