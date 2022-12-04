exports = module.exports = {}

const log = require('electron-log')

const fs = require("fs");
const path = require('path');
const { app, shell } = require('electron')

const checkDataPath = () => {
    let appDataPath 
    if(app.isPackaged){
        appDataPath = path.join(app.getPath('userData'), 'w3rpa')
    }else{
        appDataPath  = path.join(app.getAppPath(), 'w3rpa')
    }
    if(!fs.existsSync(appDataPath)){
      fs.mkdirSync(appDataPath)
      log.debug("mkdir appDataPath:"+ appDataPath)
    }
    log.info("appDataPath="+appDataPath)
  
    // check logs
    let appLogsPath = path.join(appDataPath, 'logs')
    if(!fs.existsSync(appLogsPath)){
      fs.mkdirSync(appLogsPath)
    }
    app.setPath('logs', appLogsPath)
    app.setAppLogsPath(appLogsPath)
    log.transports.file = appLogsPath
  
    // check lib
    let appUserLib = path.join(appDataPath, 'lib')
    if(!fs.existsSync(appUserLib)){
      fs.mkdirSync(appUserLib)
      log.debug("mkdir lib:"+ appUserLib)
    }
  
    // flowscript
    let flowScriptPath = path.join(appDataPath, 'flowscript')
    if(!fs.existsSync(flowScriptPath)){
      fs.mkdirSync(flowScriptPath)
      log.debug("mkdir "+ flowScriptPath)
    }
  
    // check userData for browser
    let browserUserData = path.join(appDataPath, 'userData')
    if(!fs.existsSync(browserUserData)){
      fs.mkdirSync(browserUserData)
      log.debug("mkdir "+ browserUserData)
    }
  }

  exports.checkDataPath = checkDataPath

  const appUrlDefault = ' https://rpa.w3bb.cc'
  const localApiPortDefault = 3500

  const checkAppConfig = (appConfig) => {
    let needWriteConfig = false
    const configPath = path.join(appConfig.appDataPath, 'config.json');
    if(fs.existsSync(configPath)){
      let configStr = fs.readFileSync(configPath);
      let appConfig2 = JSON.parse(configStr);
        if(!!appConfig2){
            Object.assign(appConfig, appConfig2)
        }
    }
    if(!('appUrl' in appConfig)){
      appConfig['appUrl'] = appUrlDefault
      needWriteConfig = true
    }
    if(!('localApiPort' in appConfig)){
      appConfig['localApiPort'] = localApiPortDefault
      needWriteConfig = true
    }
    // download
    if(!('downloadUrl' in appConfig)){
      appConfig['downloadUrl'] = 'https://lib-rpa.w3bb.cc'
    }
    if(needWriteConfig){
      fs.writeFileSync(configPath, JSON.stringify(appConfig))
      log.info("write app config: "+ JSON.stringify(appConfig))
    }
  }
  exports.checkAppConfig = checkAppConfig

  // will replace by rollup-plugin-copy
const copyResourceFile = ({destPath, srcPath, fileName}) => {
    let srcFile = path.join(srcPath, fileName)
    let destFile = path.join(destPath, fileName)
    if(fs.existsSync(srcFile)){
      let destParentDir = path.resolve(destFile, '..')
      if(!fs.existsSync(destParentDir)){
        fs.mkdirSync(destParentDir)
      }
      fs.copyFileSync(srcFile, destFile)
    }
  }
 
  const checkRpaCommonFile = (appConfig) => {
    // 从安装后资源包中复制rpa脚本运行依赖js
    let distPath = path.join(appConfig.appDataPath, 'dist')
    if(!fs.existsSync(distPath)){
      fs.mkdirSync(distPath)
    }
    // dist/rpa/browser.js
    // dist/rpa/dataUtil.js
    // let appResRoot = path.resolve(...[path.join(appResourcesPath, 'app.asar') , path.join(appResourcesPath, 'app') , process.cwd()])
    //   app.asar.unpacked -> app
    let appResourcesPath = process.resourcesPath
    let appResRoot = path.join(appResourcesPath, 'app.asar.unpacked')
    if(!fs.existsSync(appResRoot)){
      appResRoot = path.join(appResourcesPath, 'app.asar')
    }
    if(!fs.existsSync(appResRoot)){
      appResRoot = path.join(appResourcesPath, 'app')
    }
    if(!fs.existsSync(appResRoot)){
      appResRoot = process.cwd()
    }
    log.debug("appResRoot="+appResRoot)
    // webpack编译前 src   待处理 src => dist
    appResRoot = path.join(appResRoot, 'src')
    if(appResRoot){
      // js
      copyResourceFile({destPath: distPath,srcPath: appResRoot,fileName: 'rpa/browserUtil.js'})
      copyResourceFile({destPath: distPath,srcPath: appResRoot,fileName: 'rpa/dataUtil.js'})

      // python
      copyResourceFile({destPath: distPath,srcPath: appResRoot,fileName: 'py/Pipfile'})
      copyResourceFile({destPath: distPath,srcPath: appResRoot,fileName: 'py/rpaTask.py'})
      copyResourceFile({destPath: distPath,srcPath: appResRoot,fileName: 'py/browserUtil.py'})
      copyResourceFile({destPath: distPath,srcPath: appResRoot,fileName: 'py/dataUtil.py'})
    }
  }
  exports.checkRpaCommonFile = checkRpaCommonFile 

// 检查browser和插件

// 检查python环境
// 是否自动安装python3和pipenv?

/////////////////////////////////////////
var CryptoJS = require("crypto-js")

// 读取配置文件，需要同服务器设置一致
var rpaStorageKey = 'WEB3RPA__PRODUCTION__3.4.3__COMMON__LOCAL__KEY__'
var strKey = '_11111000001111@'
var strIv = '@11111000001111_'

var cryptoKey = CryptoJS.enc.Utf8.parse(strKey)
var cryptoIv = CryptoJS.enc.Utf8.parse(strIv)

const encryptAes = (str) =>{
    var encrypted = CryptoJS.AES.encrypt(str, cryptoKey, {
        iv: cryptoIv,
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
    })
    encrypted = encrypted.toString()
    return encrypted
}

const decryptAes = (encrypted) => {
    var decrypted = CryptoJS.AES.decrypt(encrypted, cryptoKey, {
        iv: cryptoIv,
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
    })
    decrypted = CryptoJS.enc.Utf8.stringify(decrypted)
    return decrypted
}

const encryptMd5 = (str) => {
    return CryptoJS.MD5(str).toString()
}

exports.encryptMd5 = encryptMd5

const getMainWindowStorageValue = async ({mainWindow, key}) => {
    let value
    // check localStorage
    if(!mainWindow){
        return value
    }
    await mainWindow.webContents
    .executeJavaScript('localStorage.getItem("'+key+'");', true)
    .then(result => {
      //console.debug('key='+key+',value='+result)
      value = result
    })
    // check sessionStorage
    if(!value){
        await mainWindow.webContents
        .executeJavaScript('sessionStorage.getItem("'+key+'");', true)
        .then(result => {
        value = result
        })
    }
    return value
}

var myMainWindow

const init = ({mainWindow}) => {
    myMainWindow = mainWindow
}

exports.helperInit = init


const getValueFromMainWindowStorage = async (key) => {
    if(!myMainWindow){
        return
    }
    return await getMainWindowStorageValue({mainWindow:myMainWindow, key})
}

exports.getValueFromMainWindowStorage = getValueFromMainWindowStorage

const getAppCurrentUser = async () => {
    let userInfo = {}
    if(!myMainWindow){
        return userInfo
    }
    mainWindow = myMainWindow   
    let value = await getMainWindowStorageValue({mainWindow, key:rpaStorageKey})
    if(!!value){
        let storeJson = JSON.parse(decryptAes(value))
        //console.debug(storeJson)
        // username
        if(storeJson.value['USER__INFO__'] && storeJson.value['USER__INFO__'].value){
            let username = storeJson.value['USER__INFO__'].value['username']
            userInfo['username'] = username
            userInfo['userid'] = storeJson.value['USER__INFO__'].value['id']
        }
        // token
        if(storeJson.value['TOKEN__'] && storeJson.value['TOKEN__'].value){
            let token = storeJson.value['TOKEN__'].value
            userInfo['token'] = token
        }   
    }   
    // check other
    let hostname = await getMainWindowStorageValue({mainWindow, key:'hostname'})
    if(!!hostname){
        userInfo['hostname'] = hostname
    }   
    return userInfo
}

exports.getAppCurrentUser = getAppCurrentUser