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
      ,'/w3rpa','/ref_rpa','doc','/fix_make','/release'
      ,'/userData','/logs','/flowscript','/appLoginUser','/nodeName'   // 防止老版本垃圾数据进入打包
        // ,'/dist','/lib' //window下打包失败，先注释掉，如果有这两个文件夹先手动删除
    ],
    asar: false,
    // asarUnpack: [
    //   './src/rpa/browser.js',
    //   './src/rpa/dataUtil.js'
    // ],
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
        baseUrl: 'https://update-rpa.w3bb.cc',
        username: 'rpaadmin',
        password: process.env.AUTOUPDATE_PASSWORD // string
      }
    }
  ],
  plugins: [
  ]
}

module.exports = config
