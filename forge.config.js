const os = require('os')
const platform = os.platform()
const config = {
  packagerConfig: {
    name: 'Web3RPA',
    icon: './src/images/icon/icon',
    ignore: [
      '.env','.idea','.vscode','yarn.lock','.yarnclean','.gitignore','web3rpa-electron.iml'
      ,'webpack.*.config.js','webpack.rules.js','forge.config.js','README.md'
      ,'appLoginUser','nodeName','ref_adspow','ref_multilogin'
      ,'doc','flowscript','userData','logs'
      ,'lib/chrome_105','lib/extensions'
    ],
    extraResources:['./src/']
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
        username: 'rpaadmin',
        password: process.env.AUTOUPDATE_PASSWORD // string
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
