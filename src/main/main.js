// Modules to control application life and create native browser window
//require('update-electron-app')()

const { app, ipcMain, Menu, BrowserWindow } = require('electron')
const store = require('electron-store');

// os: mac vs linux vs win
const isMac = process.platform === 'darwin'
const isLinux = process.platform === 'linux'

// app path
const fs = require("fs")
const path = require('path');
const appExecPath = app.getAppPath();
const appDataPath = appExecPath;
if(app.isPackaged){
  appExecPath = path.dirname(app.getPath('exe'));
  appDataPath = path.join(app.getPath('userData'), 'web3rpa');
}else{
  // for dev
  console.debug('isPackaged appExecPath='+path.dirname(app.getPath('exe')));
  console.debug('isPackaged appDataPath='+path.dirname(path.join(app.getPath('userData'), 'web3rpa')));

  // debug
  //console.debug('dir temp='+path.dirname(app.getPath('temp')));
  //console.debug('dir appData='+path.dirname(app.getPath('appData')));
  //console.debug('dir userData='+path.dirname(app.getPath('userData')));
}
console.log('appExecPath='+appExecPath);
console.log('appDataPath='+appDataPath);

// looad config 
// configFilePath = [appDataPath]/config.json
var appConfig = {};
const configPath = path.join(appDataPath, 'config.json');
if(fs.existsSync(configPath)){
  let configStr = fs.readFileSync(configPath);
  appConfig = JSON.parse(configStr);
}
console.debug(appConfig);


// RPA server
const {rpaConfig, startRpaServer} = require("../rpa/rpa")
const loadRpaServer = () => {
  rpaConfig.appExecPath = appExecPath
  rpaConfig.appDataPath = appDataPath
  rpaConfig.appConfig = appConfig;
  rpaConfig.isMac = isMac
  rpaConfig.isLinux = isLinux
  rpaConfig.callbackGetMainWindowStorageValue = getMainWindowStorageValue
  startRpaServer()
}

// appUrl, read from config and change by line
const appUrl = appConfig['appUrl']
// default https://rpa.w3bb.cc

var mainWindow
const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  //ipcMain.handle('ping', () => 'pong')

  // 加载 index.html
  //mainWindow.loadFile('renderer/src/index.html')
  mainWindow.loadURL(appUrl)

  mainWindow.maximize();    //打开时最大化打开，不是全屏，保留状态栏

  // 打开开发工具
  //mainWindow.webContents.openDevTools()
}

const getMainWindowStorageValue = async (key) => {
  let value
  await mainWindow.webContents
  .executeJavaScript('localStorage.getItem("'+key+'");', true)
  .then(result => {
    //console.debug('key='+key+',value='+result)
    value = result
  })
  return value
}

// 这段程序将会在 Electron 结束初始化
// 和创建浏览器窗口的时候调用
// 部分 API 在 ready 事件触发后才能使用。
app.whenReady().then(() => {

  createWindow()

  loadRpaServer()
  
  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// 除了 macOS 外，当所有窗口都被关闭的时候退出程序。 There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {

  if (!isMac) app.quit()
})

