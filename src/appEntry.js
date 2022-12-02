const log = require('electron-log')
const { app} = require('electron')
// os: mac vs linux vs win
const isMac = process.platform === 'darwin'
const isLinux = process.platform === 'linux'

// app path
const fs = require("fs");
const path = require('path');

// check app data path
let appExecPath;
let appDataPath;

const checkDataPath = () => {
  appExecPath = app.getAppPath();
  appDataPath = path.join(appExecPath, 'w3rpa');
  if(app.isPackaged){
    appExecPath = path.dirname(app.getPath('exe'));
    appDataPath = path.join(app.getPath('userData'), 'w3rpa')
  }else{
    // for develop
    console.debug('isPackaged appExecPath='+path.dirname(app.getPath('exe')))
    console.debug('isPackaged appData='+path.dirname(app.getPath('appData')))
    // /Users/[user]/Library
    console.debug('isPackaged userData='+path.dirname(app.getPath('userData')))
    // /Users/[user]/Library/Application Support
    console.debug('isPackaged logs='+path.dirname(app.getPath('logs')))
    // /Users/[user]/Library/Logs
  }
  if(!fs.existsSync(appDataPath)){
    fs.mkdirSync(appDataPath)
    log.debug("mkdir appDataPath:"+ appDataPath)
  }
  log.info("appDataPath="+appDataPath)

  let appLogsPath = path.join(appDataPath, 'logs')
  if(!fs.existsSync(appLogsPath)){
    fs.mkdirSync(appLogsPath)
    log.debug("mkdir logs:"+ appLogsPath)
  }
  app.setPath('logs', appLogsPath)
  app.setAppLogsPath(appLogsPath)
  log.transports.file = appLogsPath
  console.debug(app.getPath('logs'))

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
checkDataPath()

// check config
let appConfig = {};
const checkAppConfig = () => {
  const appUrlDefault = ' https://rpa.w3bb.cc'
  const localApiPortDefault = 3500
  let needWriteConfig = false
  const configPath = path.join(appDataPath, 'config.json');
  if(fs.existsSync(configPath)){
    let configStr = fs.readFileSync(configPath);
    appConfig = JSON.parse(configStr);
  }
  if(!('appUrl' in appConfig)){
    appConfig['appUrl'] = appUrlDefault
    needWriteConfig = true
  }
  if(!('localApiPort' in appConfig)){
    appConfig['localApiPort'] = localApiPortDefault
    needWriteConfig = true
  }
  if(needWriteConfig){
    fs.writeFileSync(configPath, JSON.stringify(appConfig))
    log.info("write app config: "+ JSON.stringify(appConfig))
  }
}
checkAppConfig()

const checkAppLibData = () => {
  // copy lib/main, lib/rpa to [appDataPath]
  // 为后续增量更新，以及更新浏览器和插件做准备
}
checkAppLibData()

if(app.isPackaged){
  // TODO
  require('./main')
  // load [appDataPath]/dist/main
}else{
  // for develop
  require('./main')
}
