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
    },
    {
      // Win
      name: '@electron-forge/maker-squirrel',
      config: {
        icon: './src/images/icon/icon.icon'
      }
    },
    {
      // Mac
      name: '@electron-forge/maker-dmg',
      config: {
        icon: './src/images/icon/icon.icns'
      }
    }
  ],
  publishers:[
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'rpa',
          name: 'wecaterpillar/web3rpa-electron'
        },
        prerelease: true
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
