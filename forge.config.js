//const os = require('os')
//const platform = os.platform()
//const { WebpackPlugin } = require('@electron-forge/plugin-webpack')

const config = {
  packagerConfig: {
    name: 'Web3RPA',
    icon: './public/images/icon/icon',
    platform: 'all',
    ignore: [
      '.env','.idea','.vscode','yarn.lock','.yarnclean','.gitignore','web3rpa-electron.iml'
      ,'webpack.*.config.js','webpack.rules.js','forge.config.js','README.md'
      ,'w3rpa','ref_rpa','doc','src','dist/native_modules'
    ],
    extraResources:[''] 
  },
  rebuildConfig: {},
  makers: [
    {
      // all
      name: '@electron-forge/maker-zip'
    },{
      name: '@electron-forge/maker-dmg',
      config: {
      }
    }, {
      name: '@electron-forge/maker-squirrel',
      config: {
      }
    }
  ],
  publishers:[
    {
      name: '@electron-forge/publisher-electron-release-server',
      config: {
        baseUrl: 'https://rpa-update.w3bb.cc',
        username: 'rpaadmin',
        password: process.env.AUTOUPDATE_PASSWORD // string
      }
    }
  ],
  plugins: [
  ]
}

module.exports = config
