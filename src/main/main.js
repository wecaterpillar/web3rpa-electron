// Modules to control application life and create native browser window
//require('update-electron-app')()

const { app, ipcMain, Menu, MenuItem, BrowserWindow, shell } = require('electron')
//const store = require('electron-store');

// os: mac vs linux vs win
const isMac = process.platform === 'darwin'
const isLinux = process.platform === 'linux'

// app path
const fs = require("fs");
const path = require('path');
let appExecPath = app.getAppPath();
let appDataPath = appExecPath;
if(app.isPackaged){
  appExecPath = path.dirname(app.getPath('exe'));
  appDataPath = path.join(app.getPath('userData'), 'web3rpa');
}else{
  // for dev
  //console.debug('isPackaged appExecPath='+path.dirname(app.getPath('exe')));
  //console.debug('isPackaged appDataPath='+path.dirname(path.join(app.getPath('userData'), 'web3rpa')));
}
//console.log('appExecPath='+appExecPath);
//console.log('appDataPath='+appDataPath);

// looad config 
// configFilePath = [appDataPath]/config.json
let appConfig = {};
const checkAppConfig = (config = {}, bWrite = false) =>{
  const configPath = path.join(appDataPath, 'config.json');
  if(fs.existsSync(configPath)){
    let configStr = fs.readFileSync(configPath);
    appConfig = JSON.parse(configStr);
  }
  if(!!config){
    Object.assign(appConfig, config)
  }
  if(!'appUrl' in appConfig){
    // default https://rpa.w3bb.cc
    appConfig['appUrl'] = 'https://rpa.w3bb.cc'
  }
  if(bWrite){
    let nodeName = appConfig['nodeName']
    appConfig['nodeName'] = undefined
    fs.writeFileSync(configPath, JSON.stringify(appConfig))
    appConfig['nodeName'] = nodeName
  }
  console.debug(appConfig);
  //console.debug(app)
}

checkAppConfig()


const resetAppUrl = (appUrl) => {
  appConfig['appUrl'] = appUrl
  mainWindow.loadURL(appUrl)
  //reset token
  if(rpaConfig.resetLoginToken){
    rpaConfig.resetLoginToken()
  }
  const configPath = path.join(appDataPath, 'config.json');
  if(fs.existsSync(configPath)){
    let nodeName = appConfig['nodeName']
    appConfig['nodeName'] = undefined
    fs.writeFileSync(configPath, JSON.stringify(appConfig))
    appConfig['nodeName'] = nodeName
  }
}
const openUserData = (subDir) => {
  let openDir = path.join(appDataPath, subDir)
  console.debug(openDir)
  shell.showItemInFolder(openDir)
}

// will fix with cloudflare certification
//app.commandLine.appendSwitch('ignore-certificate-errors') // 忽略证书检测

// helper
const {helperInit, getAppCurrentUser, getValueFromMainWindowStorage} = require('./helper')

// RPA server
const {rpaConfig, startRpaServer} = require("../rpa/rpa")
const loadRpaServer = () => {
  // config
  rpaConfig.appExecPath = appExecPath
  rpaConfig.appDataPath = appDataPath
  rpaConfig.appConfig = appConfig
  rpaConfig.isPackaged = app.isPackaged
  rpaConfig.isMac = isMac
  rpaConfig.isLinux = isLinux

  // callback
  rpaConfig.callbackCheckAppConfig = checkAppConfig
  rpaConfig.callbackGetAppCurrentUser = getAppCurrentUser
  rpaConfig.callbackGetValueFromMainWindowStorage = getValueFromMainWindowStorage

  // start rpa
  startRpaServer()
}

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

  // appUrl, read from config and change by line
  let appUrl = appConfig['appUrl']
  if(!appUrl){
    appUrl = 'https://rpa.w3bb.cc'
  }

  // 加载 index.html
  //mainWindow.loadFile('renderer/src/index.html')
  mainWindow.loadURL(appUrl)

  mainWindow.maximize();    //打开时最大化打开，不是全屏，保留状态栏

  // 打开开发工具
  //mainWindow.webContents.openDevTools()

  // helper init
  helperInit({mainWindow})
}



// 这段程序将会在 Electron 结束初始化
// 和创建浏览器窗口的时候调用
// 部分 API 在 ready 事件触发后才能使用。
app.whenReady().then(() => {

  loadMenu()

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



const loadMenu = () => {
  let menuTemplate = [
    // { role: 'appMenu' }
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { label: 'Logs',
          click: function() {
            openUserData('logs')
          }
        },
        { label: 'Browser UserData',
          click: function() {
            openUserData('userData')
          }
        },
        { type: 'separator' },
        { role: 'close' } 
      ]
    }]:[{
      label: 'File',
          submenu: [
            { label: 'Logs',
            click: function() {
              openUserData('logs')
            }
          },
          { label: 'Browser UserData',
            click: function() {
              openUserData('userData')
            }
          },
            { type: 'separator' },
            { role: 'quit' }
          ]
        }    
    ]),
    // { role: 'editMenu' }
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        ...(isMac ? [
          { role: 'pasteAndMatchStyle' },
          { role: 'delete' },
          { role: 'selectAll' },
          { type: 'separator' },
          {
            label: 'Speech',
            visible: false,
            submenu: [
              { role: 'startSpeaking' },
              { role: 'stopSpeaking' }
            ]
          }
        ] : [
          { role: 'delete' },
          { type: 'separator' },
          { role: 'selectAll' }
        ])
      ]
    },
    // { role: 'windowMenu' }
    {
      label: 'Window',
      submenu: [
        { label: 'reload', role: 'forceReload' },
        { label: 'reload RPA', click: function (){
          //startRpaServer()
        }},
        { role: 'toggleDevTools', visible: false},
        { role: 'reload', visible: false },
        { role: 'togglefullscreen'},
        { type: 'separator' },
        { label: 'change Line',
          submenu:[
            {
              label: 'line1(sg+cf)',
              type: 'radio', 
              checked: appConfig['appUrl'].indexOf("rpa.")>-1,
              click: function (){
                appConfig['appUrl'].indexOf("rpa.")>-1 || resetAppUrl('https://rpa.w3bb.cc')
              }
            },
            {
              label: 'line2(hk+cf)',
              type: 'radio', 
              checked: appConfig['appUrl'].indexOf("rpa2.")>-1,
              click: function (){
                appConfig['appUrl'].indexOf("rpa2.")>-1 || resetAppUrl('https://rpa2.w3bb.cc')
              }
            },
            {
              label: 'line2b(hk)',
              type: 'radio', 
              checked: appConfig['appUrl'].indexOf("rpa2b.")>-1,
              click: function (){
                appConfig['appUrl'].indexOf("rpa2b.")>-1 || resetAppUrl('https://rpa2b.w3bb.cc')
              }
            }
          ]},
        { type: 'separator' },
       
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { role: 'resetZoom' },
        ...(isMac ? [
          { type: 'separator' },
          { role: 'front' },
        ] : [
          { role: 'close' }
        ])
      ]
    },
    {
      role: 'help',
      submenu: [
        { role: 'about' },
        {
          label: 'Learn More',
          click: async () => {
            const { shell } = require('electron')
            await shell.openExternal('https://electronjs.org')
          }
        }
      ]
    }
  ]
  // check menu
  let menu = Menu.buildFromTemplate(menuTemplate)
  Menu.setApplicationMenu(menu)
}



