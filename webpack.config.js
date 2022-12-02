const path = require("path")
function resolve (dir) {
  return path.join(__dirname, '..', dir)
}
module.exports = {
  target: 'electron-main',
  mode: 'none',  //none/development/production
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  entry: {
    'rpa/browser':'./src/rpa/browser.js',
    'rpa/dataUtil':'./src/rpa/dataUtil.js',
    'appEntry':'./src/appEntry.js'},
  output: {
    filename: './[name].js',
    path: path.resolve(__dirname, 'dist')
  },
  // Put your normal webpack config below here
  module: {
    rules: require('./webpack.rules')
  },
  // resolve:{
  //   extensions: ['.js', '.vue', '.json'],
  //   modules:[
  //     resolve('src'),
  //     resolve('node_modules')
  //   ],
  //   alias:{
  //     'src': resolve('src')
  //   }
  // }
};