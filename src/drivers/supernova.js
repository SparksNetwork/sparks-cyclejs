import {
  view, lensPath, join, split, compose, without,
} from 'ramda'

const inLens = lensPath(['data', 'supernova', 'in'])
const outLens = lensPath(['data', 'supernova', 'out'])

const Supernova = {
  create: (empty, vnode) => {
    const inData = view(inLens, vnode)

    if (inData) {
      const {className} = inData
      vnode.elm.className += ` ${className}`
    }
  },

  remove: (vnode, fn) => {
    const outData = view(outLens, vnode)
    const inData = view(inLens, vnode)

    if (outData) {
      const elm = vnode.elm
      const pos = elm.getBoundingClientRect()

      elm.style.position = 'absolute'
      elm.style.top = `${pos.top + window.scrollY}px`
      elm.style.left = `${pos.left + window.scrollX}px`
      elm.style.width = `${pos.width}px`
      elm.style.height = `${pos.height}px`
      elm.style.zIndex = -1
      document.body.appendChild(elm)

      if (inData) {
        elm.className = compose(
          join(' '),
          without(inData.className),
          split(' '),
        )(elm.className)
      }

      const {duration, className} = outData
      elm.className += ` ${className}`

      setTimeout(fn, duration)
    } else {
      fn()
    }
  },
}

export default Supernova
