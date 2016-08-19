import {iframe} from 'cycle-snabbdom'
import {
  merge, prop, assoc, dissoc, compose,
} from 'ramda'
import {absoluteUrl, toQueryString} from 'util'

const defaultAttrs = {
  style: 'border:none;overflow:hidden',
  scrolling: 'no',
  frameborder: 0,
  allowTransparency: true,
}

const _Facebook = (sources, dimensions, query) => {
  const path$ = sources.path$ || sources.router.observable
    .map(prop('pathname'))

  const href$ = path$.map(path => absoluteUrl(path))

  const src = query.src
  const attrs = merge(defaultAttrs, dimensions)

  const DOM = href$
    .map(href => assoc('href', href, query))
    .map(compose(
      toQueryString,
      merge(dimensions),
      dissoc('src')
    ))
    .map(queryString => src + '?' + queryString)
    .map(src => assoc('src', src, attrs))
    .map(attrs => iframe({attrs}))

  return {DOM}
}

const Share = sources => {
  return _Facebook(
    sources,
    {width: 73, height: 28},
    {
      src: 'https://www.facebook.com/plugins/share_button.php',
      layout: 'button',
      size: 'large',
      mobile_iframe: true,
    },
  )
}

const Recommend = sources => {
  return _Facebook(
    sources,
    {width: 173, height: 65},
    {
      src: 'https://www.facebook.com/plugins/like.php',
      layout: 'button',
      action: 'recommend',
      size: 'large',
      show_faces: false,
      share: true,
    },
  )
}

export {Share, Recommend}
