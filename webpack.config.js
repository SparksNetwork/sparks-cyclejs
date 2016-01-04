var path = require('path');
var webpack = require('webpack');

module.exports = {
  entry: ['./js/main'],
  output: {
    filename: './dist/bundle.js'
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        loaders: ['babel'],
        include: __dirname,
        exclude: /node_modules/
      }
    ]
  }
};
