const path = require('path')
const webpack = require('webpack')

const config = {
  // The entry point(s) for which code to transpile
  entry: [
    // Set up an ES6-ish environment
    'babel-polyfill',
    // Add your application's scripts below
    './src/index.js',
  ],

  // The output destination(s) for Nomad bundle(s)
  output: {
    // Output the minified bundle into /dist as 'nomad.min.js'
    filename: 'nomad.min.js',
    path: path.resolve(__dirname, 'dist')
  },

  module: {
    preLoaders: [
      // Handle the encountering of json
      // https://github.com/webpack/webpack/issues/965
      { test: /\.json$/, loader: 'json' },
    ],

    loaders: [
      // Run js code through Babel
      {
        // Only run `.js` files through Babel
        loader: 'babel-loader',
        test: /\.js$/,
        // Only include the files in /src
        include: path.resolve(__dirname, 'src'),
        // Options to configure babel
        query: {
          plugins: ['transform-runtime'],
          presets: ['es2015', 'stage-0', 'stage-1'],
        }
      },

      // Expose Nomad on the window for the browser bundle
      {
        test: require.resolve('./src/index'),
        loader: "expose-loader?Nomad"
      }
    ],
  },

  /*
    * In order to transfer files, this is a very important step in your Webpack
    * configuration, see more at:
    * https://github.com/ipfs/js-ipfs#use-in-the-browser-with-browserify-webpack-or-any-bundler
    */
   resolve: {
     alias: {
       zlib: 'browserify-zlib-next'
     }
   }

  // // TODO: figure out minification error
  // plugins: [
  //   new webpack.optimize.UglifyJsPlugin({
  //     compressor: { keep_fnames: true, warnings: false },
  //     mangle: { keep_fnames: true }
  //   })
  // ]
}

module.exports = config
