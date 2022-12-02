const path = require("path")
module.exports = {
  target: 'electron-main',
  mode: 'production',  //none/development/production
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  entry: {
    'appEntry':'./src/appEntry.js'},
  output: {
    filename: './[name].js',
    path: path.resolve(__dirname, 'dist')
  },
  // Put your normal webpack config below here
  module: {
    rules: require('./webpack.rules')
  }
};