// 0. check update
const { app, protocol, Menu, BrowserWindow, shell } = require('electron')
const isMac = process.platform === 'darwin'
const isLinux = process.platform === 'linux'

const log = require('electron-log')
Object.assign(console, log.functions)

if(!isMac && !isLinux){
  // fix Squirrel.Windows will spawn your app an additional time with some special arguments
  // https://www.electronforge.io/config/makers/squirrel.windows
  if (require('electron-squirrel-startup')) {
    log.warn('you need restart app again. (electron-squirrel-startup)')
    app.quit()
  }
}

protocol.registerSchemesAsPrivileged([
  {scheme:'w3rpa', privileges:{bypassCSP:true}}
])

const fs = require("fs");
const path = require('path');

// 1. load config and check 
// helper
const helper = require('../help/helper')

const appConfig = {}
let appDataPath = helper.getAppDataPath()
appConfig.appDataPath = appDataPath

// configFilePath = [appDataPath]/config.json
helper.checkAppConfig(appConfig)


// 2. mainWindown
var mainWindow
const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 900,
    webPreferences: {
      webSecurity: false, //取消跨域限制
      scrollBounce: true,
      preload: path.join(__dirname, '../renderer/preload.js')
    }
  })

  // appUrl, read from config and change by line
  let appUrl = appConfig['appUrl']
  if(!!!appUrl){
    // default url
    appUrl = 'https://rpa.w3bb.cc'
  }

  loadMenu()
  
  // 加载 index.html
  //mainWindow.loadFile('src/renderer/index.html')
  mainWindow.loadURL(appUrl)

  mainWindow.maximize();    //打开时最大化打开，不是全屏，保留状态栏

  // 打开开发工具
  //mainWindow.webContents.openDevTools()

  // helper init
  helper.helperInit({mainWindow})
}

// 3. RPA server
const rpaServer  = require("../rpa/rpaServer")
const loadRpaServer = () => {
  // config
  let rpaConfig = rpaServer.rpaConfig
  rpaConfig.appDataPath = appDataPath
  rpaConfig.appConfig = appConfig
  rpaConfig.isPackaged = app.isPackaged
  rpaConfig.isMac = isMac
  rpaConfig.isLinux = isLinux

  // callback, will move to rpaServer
  //rpaConfig.callbackCheckAppConfig = checkAppConfig
  rpaConfig.callbackGetAppCurrentUser = helper.getAppCurrentUser
  rpaConfig.callbackGetValueFromMainWindowStorage = helper.getValueFromMainWindowStorage

  //rpaServer.callbackGetAppCurrentUser = helper.getAppCurrentUser
  //rpaServer.callbackGetValueFromMainWindowStorage = helper.getValueFromMainWindowStorage

  // prepare in helper
  helper.checkRpaCommonFile(appConfig)

  // start rpa
  rpaServer.startRpa()
  
}

// 4. app event - whenReady
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

process.on('uncaughtException', (err) => {
  log.error(err)
})


// 5. menu and handle menu action

const resetAppUrl = (appUrl) => {
  appConfig['appUrl'] = appUrl
  mainWindow.loadURL(appUrl)
  //reset token
  try{
    if(rpaServer.resetLoginToken){
      rpaServer.resetLoginToken()
    }
  }catch(err){
    log.warn(err)
  }
  helper.saveAppConfig(appConfig)
  const configPath = path.join(appDataPath, 'config.json');
}
const openUserData = (subDir) => {
  let openDir = path.join(appDataPath, subDir)
  if("applogs" === subDir){
    openDir = app.getPath('logs')
  }
  log.debug("open dir:"+openDir)
  shell.showItemInFolder(openDir)
}

const loadMenu = () => {
  let menuTemplate = [
    // { role: 'appMenu' }
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { label: 'RPA Logs',
          click: function() {
            openUserData('logs')
          }
        },
        // { label: 'App Logs',
        //   click: function() {
        //     openUserData('applogs')
        //   }
        // },
        { label: 'Browser UserData',
          click: function() {
            openUserData('userData')
          }
        },
        { type: 'separator' },
        { role: 'close' } ,
        { role: 'quit' }
      ]
    }]:[{
      label: 'File',
          submenu: [
            { label: 'RPA Logs',
            click: function() {
              openUserData('logs')
            }
          },
          { label: 'App Logs',
          click: function() {
            openUserData('applogs')
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
        // { label: 'reload RPA', click: function (){
        //   //startRpaServer()
        // }},
        { role: 'toggleDevTools', visible: true},
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
  //log.debug(menuTemplate)
  let menu = Menu.buildFromTemplate(menuTemplate)
  Menu.setApplicationMenu(menu)
}



