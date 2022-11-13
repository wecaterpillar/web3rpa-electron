// Modules to control application life and create native browser window
//require('update-electron-app')()
const { app, ipcMain, Menu, BrowserWindow } = require('electron')
const isMac = process.platform === 'darwin'
const fs = require("fs")
const path = require('path')

const playwright = require('playwright')


// appUrl, read from config and change by line
const appUrl = 'https://rpa.w3bb.cc/'

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
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

  // 打开开发工具
  //mainWindow.webContents.openDevTools()
}

const createPlaywrightWindow = (playwright) => {
  (async () => {
    const browser = await playwright.chromium.launch({handless:false})
    const context = await browser.newContext()
    const page = await context.newPage('https://www.baidu.com')
    await page.goto('https://www.baidu.com')
    await page.screenshot({path:'example-baidu.png'})
    await browser.close()
  })()
}
// 这段程序将会在 Electron 结束初始化
// 和创建浏览器窗口的时候调用
// 部分 API 在 ready 事件触发后才能使用。
app.whenReady().then(() => {
  createWindow()
  
  //createPlaywrightWindow(playwright)

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

