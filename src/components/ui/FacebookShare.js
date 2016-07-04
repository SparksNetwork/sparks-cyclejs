import {Observable as $} from 'rx'
import {iframe} from 'cycle-snabbdom'
import {
  join, merge, prop,
} from 'ramda'
import {absoluteUrl, toQueryString} from 'util'

const srcUrl = 'https://www.facebook.com/plugins/share_button.php'

const defaultAttrs = {
  width: 73,
  height: 28,
  style: 'border:none;overflow:hidden',
  scrolling: 'no',
  frameborder: 0,
  allowTransparency: true,
}

const shareSrc = (href, attrs) => {
  const urlAttrs = {
    href,
    layout: 'button',
    size: 'large',
    mobile_iframe: 'true',
    width: attrs.width,
    height: attrs.height,
  }

  const queryString = toQueryString(urlAttrs)

  return join('?', [srcUrl, queryString])
}

const FacebookShare = sources => {
  const path$ = sources.path$ || sources.router.observable
    .map(prop('pathname'))

  const href$ = path$.map(path => absoluteUrl(path))
    .tap(x => console.log('href$', x))

  const attrs$ = (sources.attrs$ || $.of({}))
    .map(attrs =>
      merge(defaultAttrs, attrs)
    )

  const DOM = $.combineLatest(
    href$, attrs$
  )
  .map(([href, attrs]) =>
    merge(attrs, {
      src: shareSrc(href, attrs),
    })
  )
  .map(attrs =>
    iframe({attrs})
  )

  return {DOM}
}

export default FacebookShare
