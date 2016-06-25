import smith from './static'
import webpack from 'webpack'
import {spawn} from 'child_process'

console.log('Metalsmith build')
smith.build(err => {
  if (err) {
    console.error('Metalsmith error', err)
    process.exit(1)
  }
  console.log('Metalsmith built')
})

const webpackConfig = require('./webpack.config')
const compiler = webpack(webpackConfig)
console.log('Webpack build')
compiler.run(err => {
  if (err) {
    console.error('Webpack error', err)
    process.exit(1)
  }

  console.log('Webpack built')

  if (process.env.BUGSNAG_API_KEY) {
    const urls = {
      staging: 'http://staging.sparks.network',
      production: 'http://sparks.network',
    }

    const baseUrl = urls[process.env.BUILD_ENV]
    if (!baseUrl) { return }

    console.log('Uploading sourcemaps to bugsnag')
    const child = spawn('curl', [
      'https://upload.bugsnag.com',
      `-F apiKey=${process.env.BUGSNAG_API_KEY}`,
      `-F overwrite=true`,
      `-F minifiedUrl=${baseUrl}/bundle.js`,
      `-F sourceMap=@dist/bundle.js.map`,
    ])

    child.on('close', code => {
      console.log('Sourcemap upload finished with code', code)
    })
  }
})
