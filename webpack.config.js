import path from 'path'
import webpack from 'webpack'
import ExtractTextPlugin from 'extract-text-webpack-plugin'
import importUrl from 'postcss-import-url'

if (!process.env.BUILD_ENV) {
  process.env.BUILD_ENV = 'development'
}
const ENV = process.env.BUILD_ENV

const srcPath = path.join(__dirname, '/src')
const imagePath = path.join(__dirname, '/images')

console.log(ENV)

const basePlugins = [
  new webpack.EnvironmentPlugin([
    'BUILD_ENV',
    'FIREBASE_API_KEY',
    'FIREBASE_AUTH_DOMAIN',
    'FIREBASE_DATABASE_URL',
  ]),
  new ExtractTextPlugin('styles.css', {allChunks: true, disable: ENV === 'development'}),
  new webpack.DefinePlugin({
    Sparks: 'window.Sparks',
  }),
]

const plugins = {
  production: basePlugins.concat([
    new webpack.optimize.UglifyJsPlugin({minimize: true}),
  ]),
  staging: basePlugins.concat([
    new webpack.optimize.UglifyJsPlugin({minimize: true}),
  ]),
  development: basePlugins.concat([
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.HotModuleReplacementPlugin(),
  ]),
}

const entry = {
  production: [
    'babel-polyfill',
    './src/main',
  ],
  staging: [
    'babel-polyfill',
    './src/main',
  ],
  development: [
    './src/main',
    'webpack-hot-middleware/client',
  ],
}

function extractOrNot(fallback, loader) {
  if (ENV === 'development') {
    return [fallback, loader].join('!')
  } else {
    return ExtractTextPlugin.extract(fallback, loader)
  }
}

module.exports = {
  entry: entry[ENV],
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'bundle.js',
    sourceMapFilename: '[file].map',
    publicPath: '/',
  },
  devtool: 'source-map',
  devServer: {
    inline: true,
    historyApiFallback: true,
    stats: {
      colors: true,
    },
    publicPath: '/',
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        loaders: ['babel', 'eslint'],
        include: __dirname,
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        loader: extractOrNot(
          'style-loader',
          'css?modules&importLoaders=1&localIdentName=[local]!postcss',
        ),
        include: __dirname,
      },
      {
        test: /\.scss/,
        loader: extractOrNot(
          'style-loader',
          'css?modules&importLoaders=1&localIdentName=[local]!postcss!sass?outputStyle=expanded',
        ),
      },
      {
        test: /\.(jpe?g|png|gif|svg)$/i,
        loaders: [
          'file?hash=sha512&digest=hex&name=[hash].[ext]',
          'image-webpack?bypassOnDebug&optimizationLevel=7&interlaced=false',
        ],
      },
    ],
  },
  externals: {
    Bugsnag: 'Bugsnag',
  },
  resolve: {
    alias: {
      drivers: srcPath + '/drivers',
      components: srcPath + '/components',
      helpers: srcPath + '/helpers',
      root: srcPath + '/root',
      images: imagePath,
      util: srcPath + '/util',
      remote: srcPath + '/remote',
    },
  },
  plugins: plugins[ENV],
  postcss: function postcss() {
    return [importUrl]
  },
}
