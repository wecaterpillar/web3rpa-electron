const { app, shell } = require('electron')
const log = require('electron-log')
const fs = require("fs");
const path = require('path');

exports = module.exports = {}

var myMainWindow
const init = ({mainWindow}) => {
    myMainWindow = mainWindow
    handleDownload({mainWindow})
}
exports.helperInit = init
exports.init = init



const appUrlDefault = ' https://rpa.w3bb.cc'
const localApiPortDefault = 3500

const getAppDataPath = () => {
  let appDataPath = path.join(app.getAppPath(), 'w3rpa')
  if(app.isPackaged){
    appDataPath = path.join(app.getPath('userData'), 'w3rpa')
  }
  return appDataPath
}

exports.getAppDataPath = getAppDataPath

const saveAppConfig = (appConfig) => {
  let appDataPath  = appConfig.appDataPath
  if(!appDataPath){
    appDataPath = getAppDataPath(app)
  } 
  const configPath = path.join(appDataPath, 'config.json');

  // remove some properties??
  let nodeName = appConfig['nodeName']
  if(!!nodeName){
    delete appConfig['nodeName']
    fs.writeFileSync(configPath, JSON.stringify(appConfig, null, 2))
    appConfig['nodeName'] = nodeName
  }else{
    fs.writeFileSync(configPath, JSON.stringify(appConfig, null, 2))
  }
  log.info("write app config: "+ JSON.stringify(appConfig, null, 2))

}
exports.saveAppConfig = saveAppConfig

const checkAppConfig = (appConfig) => {
  // 1. check app data path and logs path
  let appDataPath  = appConfig.appDataPath
  if(!appDataPath){
    appDataPath = getAppDataPath(app)
  } 
  if(!fs.existsSync(appDataPath)){
    fs.mkdirSync(appDataPath)
    log.debug("mkdir appDataPath:"+ appDataPath)
  }
  log.info("appDataPath="+appDataPath)

     // check logs
    // default log path
    //on Linux: ~/.config/{app name}/logs/{process type}.log
    //on macOS: ~/Library/Logs/{app name}/{process type}.log
    //on Windows: %USERPROFILE%\AppData\Roaming\{app name}\logs\{process type}.log
  let appLogsPath = path.join(appDataPath, 'logs')
  if(!fs.existsSync(appLogsPath)){
    fs.mkdirSync(appLogsPath)
  }
  log.transports.file.resolvePath = () => path.join(appDataPath, 'logs' ,'main.log')
    //log.initialize({ preload: true })

  // 2. check base config
  let needWriteConfig = false
  const configPath = path.join(appDataPath, 'config.json');
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
  // if(!('downloadUrlBase' in appConfig)){
  //   appConfig['downloadUrlBase'] = 'https://lib-rpa.w3bb.cc'
  // }
  if(needWriteConfig){
    saveAppConfig(appConfig)
  }

  // 3. check user data directions
  // 3.1 check lib
  let appUserLib = path.join(appDataPath, 'lib')
  if(!fs.existsSync(appUserLib)){
    fs.mkdirSync(appUserLib)
    log.debug("mkdir lib:"+ appUserLib)
  }

  // 3.2 flowscript
  let flowScriptPath = path.join(appDataPath, 'flowscript')
  if(!fs.existsSync(flowScriptPath)){
    fs.mkdirSync(flowScriptPath)
    log.debug("mkdir "+ flowScriptPath)
  }

  // 3.3 check userData for browser
  let browserUserData = path.join(appDataPath, 'userData')
  if(!fs.existsSync(browserUserData)){
    fs.mkdirSync(browserUserData)
    log.debug("mkdir "+ browserUserData)
  }    

  // 3.4 softlink to node_modules
  // [appExePath]/Resources/(app.asar|app)/node_modules => [appDataPath]/node_modules
  let symlinkMoudlesPath = path.join(appDataPath, 'node_modules')
  if(!fs.existsSync(symlinkMoudlesPath)){
    let modulesPath = path.resolve('node_modules')
    if(!modulesPath || !fs.existsSync(modulesPath)){
      modulesPath = null
      
      let basePath
      let appResourcesPath = process.resourcesPath
      basePath = path.join(appResourcesPath,'app.asar')
      if(!fs.existsSync(basePath)){
        basePath = path.join(appResourcesPath,'app')
      }
      if(fs.existsSync(path.join(basePath, 'node_modules'))){
        modulesPath = path.join(basePath, 'node_modules')
      }
    }
    log.debug(modulesPath)
    if(!!modulesPath){
      fs.symlinkSync(modulesPath, symlinkMoudlesPath)
    }
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
    // ??????????????????????????????rpa??????????????????js
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
    // webpack????????? src   ????????? src => dist
    appResRoot = path.join(appResRoot, 'src')
    if(appResRoot){
      // js
      copyResourceFile({destPath: distPath,srcPath: appResRoot,fileName: 'rpa/browserUtil.js'})
      copyResourceFile({destPath: distPath,srcPath: appResRoot,fileName: 'rpa/dataUtil.js'})
      copyResourceFile({destPath: distPath,srcPath: appResRoot,fileName: 'rpa/preload.js'})
      copyResourceFile({destPath: distPath,srcPath: appResRoot,fileName: 'rpa/rpaUtil.js'})

      // python
      copyResourceFile({destPath: distPath,srcPath: appResRoot,fileName: 'py/Pipfile'})
      copyResourceFile({destPath: distPath,srcPath: appResRoot,fileName: 'py/rpaTask.py'})
      copyResourceFile({destPath: distPath,srcPath: appResRoot,fileName: 'py/browserUtil.py'})
      copyResourceFile({destPath: distPath,srcPath: appResRoot,fileName: 'py/dataUtil.py'})
    }
  }
  exports.checkRpaCommonFile = checkRpaCommonFile 

// ??????browser?????????

let downloadUrlBase = 'https://lib-rpa.w3bb.cc/'
let downloadList = []
const addDownloads = (addDownloads) => {
  log.debug("addDownloads:"+ JSON.stringify(addDownloads,null,2))
  // ?????????????????????????????????????????????
  // ?????????????????????????????????????????????????????????????????????
  for(i in addDownloads){
    let addItem = addDownloads[i]
    let downloadUrl = addItem['downloadUrl']
    if(!downloadUrl.startsWith('http')){
      downloadUrl = downloadUrlBase + downloadUrl
    }
    let doing = false
    for(j in downloadList){
      let downloading = downloadList[j]
      let downloadingUrl = downloading['downloadUrl']
      if(downloadingUrl === downloadUrl){
        // ?????????????????????
        doing = true
        break
      }
    }
    if(doing){
      continue
    }
    downloadList.push(addItem)
    myMainWindow.webContents.downloadURL(downloadUrl)
  }
  log.debug(downloadList)
} 

exports.addDownloads = addDownloads


const checkExistDistFile =  ({distFile}) => {
  // ??????????????????????????????
  let appDataPath =getAppDataPath()
  if(fs.existsSync(path.join(appDataPath, distFile))){
     return true
  }
  // ??????????????????zip????????????
  let zipFile = path.join(appDataPath, distFile+'.zip')
  if(fs.existsSync(zipFile)){
    extractZipFile({zipFile})
    return true
  }
  return false
}
exports.checkExistDistFile = checkExistDistFile

const extractZipFile = async ({zipFile}) => {
    try{  
      let basePath = path.join(zipFile,'..')
      if(!fs.existsSync(basePath)){
        fs.mkdirSync(basePath)
      }
      let distPath = basePath
      let filename = path.basename(zipFile)
      // ????????????????????????app???exe?????????zip????????????zip?????????????????????????????????????????????
      if(!filename.endsWith('.app.zip') && !filename.endsWith('.exe.zip')){
        distPath = path.join(basePath, filename.replace('.zip',''))
        if(!fs.existsSync(distPath)){
          fs.mkdirSync(distPath)
        }
      }   
      const extract = require('extract-zip')
      await extract(zipFile, {dir: distPath}) 
    }catch(err){
      log.warn(err)
    }  
}

const handleDownload = ({mainWindow, appDataPath}) => {
  if(!appDataPath){
    appDataPath = getAppDataPath()
  }
  mainWindow.webContents.session.on('will-download', (event, item, webContents) => {
    // ???????????????????????????????????????
    let downloadUrl = item.getURL()
    let downloadingItem
    for(j in downloadList){
      downloadingItem = downloadList[j]
      let downloadingUrl = downloadingItem['downloadUrl']
      if(downloadingUrl === downloadUrl){
        break
      }
    }
    if(!downloadingItem){
      // ?????????????????????????????????????????????
      return
    }
    //????????????????????????
    let savePath
    let dist = downloadingItem['dist']
    // ????????????????????????zip???????????????zip?????????.zip.download ???????????????.zip ???????????????????????????
    let filename = item.getFilename()
    if(filename.endsWith('.zip')){
      savePath = path.join(appDataPath, dist, '..', filename+'.download')
    }else{
      savePath = path.join(appDataPath, dist)
    }
    //?????????????????? ????????????????????????
    item.setSavePath(savePath)
    //??????????????????
    item.on('updated', (event, state) => {
        //?????????????????????????????????
        if (state === 'interrupted') {
            console.log('Download is interrupted but can be resumed')
        } else if (state === 'progressing') {
            //?????????????????????
            if (item.isPaused()) {
                //???????????????
                console.log('Download is paused')
            } else {
                //???????????????
                let logMsg = `complete:${(item.getReceivedBytes() / item.getTotalBytes() * 100).toFixed(2)}%`
                console.log(logMsg)
                //?????????????????? -1?????????
                mainWindow.setProgressBar(item.getReceivedBytes() / item.getTotalBytes())
            }
        }
    })
    //????????????
    item.once('done', (event, state) => {
        // ?????????????????????
        console.log("done:"+item.getFilename())
        // ??????.zip.download???????????????.zip
        let savePath =item.getSavePath()
        let filename = item.getFilename()
        let zipFile
        if(savePath.endsWith('.zip.download')){
          //rename
          zipFile = savePath.substring(0, savePath.length-9)
          log.debug('zipFile='+zipFile)
          fs.renameSync(savePath, zipFile)
        }else if(savePath.endsWith('.zip')){
          zipFile = savePath
        }
        if(zipFile && filename.endsWith('.zip')){
          try{     
            extractZipFile({zipFile:zipFile})
          }catch(err){
            log.warn(err)
          }       
        }
 
        try{  
          // delete from download list
          let downloadUrl = item.getURL()
          let downloadingItem
          for(j in downloadList){
            downloadingItem = downloadList[j]
            let downloadingUrl = downloadingItem['downloadUrl']
            if(downloadingUrl === downloadUrl){
              downloadList.splice(i,1)
              break
            }
          }
        }catch(err){
          log.warn(err)
        }      
    })
  })
}


// ??????python??????
// ??????????????????python3???pipenv?

/////////////////////////////////////////
var CryptoJS = require("crypto-js")

// ???????????????????????????????????????????????????
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
    if(!mainWindow ){
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
    let mainWindow = myMainWindow   
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