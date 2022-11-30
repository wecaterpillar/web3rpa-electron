const os = require('os')
const platform = os.platform()
const config = {
  packagerConfig: {
    name: 'Web3RPA',
    icon: './src/images/icon/icon',
    extraResources:['./src/**']
  },
  rebuildConfig: {},
  makers: [
    {
      // all
      name: '@electron-forge/maker-zip',
      platforms: ['darwin']
    }
  ],
  publishers:[
    {
      name: '@electron-forge/publisher-electron-release-server',
      config: {
        baseUrl: 'https://rpa-update.w3bb.cc',
        username: 'admin',
        password: process.env.PASSWORD // string
      }
    }
  ],
  // plugins: [
  //   {
  //     name: '@electron-forge/plugin-webpack',
  //     config: {
  //       mainConfig: './webpack.main.config.js'
  //     }
  //   }
  // ]
}

module.exports = config
