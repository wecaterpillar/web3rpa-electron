const playwright = require('playwright')

const fs = require("fs")
const path = require('path')


// context pool
const mapBrowser = new Map();  // browserId -> browserObject { }

var rpaConfig
var browserDefaultConfig = {}

const getBrowserExtensions = (extensions) => {
  // TODO 插件配置检查,以及配置文件是否存在
  // https://playwright.dev/docs/chrome-extensions
  var  browserExtensions = [
    //path.join(rpaConfig.appDataPath, 'extensions/metamask-chrome-10.22.2.zip')   //MetaMask
  ]
  return browserExtensions
}

const getBrowserExecutablePath = (browserType, version, browserName) => {
  // 浏览器执行文件检查
  //浏览器 版本优先级 1 浏览器配置指定 2 playwright默认配置 3 系统默认配置
  // https://playwright.dev/docs/browsers
  let executablePath;
  if(rpaConfig.isMac){
    // 1 浏览器配置指定
    //executablePath: path.join(rpaConfig.appDataPath, 'lib/chrome_105/SunBrowser.app/Contents/MacOS/SunBrowser'),
    //executablePath: path.join(rpaConfig.appDataPath, 'lib/chrome_107/BraveBrowser.app/Contents/MacOS/Brave Browser'),
    // 2 playwright默认配置
    // ~/Library/Caches/ms-playwright/chromium-1028/chrome-mac/Chromium.app
    // 3 系统默认配置
    let bravePath = path.join(rpaConfig.appDataPath, 'lib/chrome_107/BraveBrowser.app/Contents/MacOS/Brave Browser')
    let chromeDefault = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    if(fs.existsSync(bravePath)){
      executablePath = bravePath;
    }else if(fs.existsSync(chromeDefault)){
      executablePath = chromeDefault
    }
  }else if(rpaConfig.isLinux){

    // ~/.cache/ms-playwright

  }else{
    //win32

    // %USERPROFILE%\AppData\Local\ms-playwright

  }
  return executablePath;
}

const getBrowserUserDataDir = (browserId) => {
  // 默认目录如何处理，固定default或者不指定
  if(!!browserId){
    return path.join(rpaConfig.appDataPath, '/userData/'+browserId)
  }
  return
}

const browserInitDefaultConfig = () => {

  browserDefaultConfig = {
    indexUrl: 'https://www.sogou.com',  //主页地址
    options: {
      headless: false, //是否无头浏览器
      //slowMo: 1000,//延迟
      // executablePath = /Applications/Google Chrome.app/Contents/MacOS/Google Chrome
      //executablePath: path.join(rpaConfig.appDataPath, 'lib/chrome_105/SunBrowser.app/Contents/MacOS/SunBrowser'),
      executablePath: path.join(rpaConfig.appDataPath, 'lib/chrome_107/BraveBrowser.app/Contents/MacOS/Brave Browser'),
      ignoreDefaultArgs: ['--enable-automation'],
        args: [
            '--disable-blink-features=AutomationControlled'
        ],
    }
  }
}

const browserInit = (config) => {
  console.debug('browser init')
  rpaConfig = config
  browserInitDefaultConfig()
  // browser pool init?
}

// for dev

const createBrowser = () => {
  (async () => {
    const browser = await playwright.chromium.launch({headless:false})
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.goto('https://www.baidu.com')
    await page.screenshot({path:'test1-baidu.png'})
    //await browser.close()
  })()
}



const openBrowser = (config) => {

  (async () => {
    var browserConfig = {}
    Object.assign(browserConfig, browserDefaultConfig)
    if(config){
      Object.assign(browserConfig, config)
    }
    console.debug(browserConfig);

    // load context
    let context
    
    // 根据browserId检查是否有同id的browser正在运行
    // check browserId and browserUserDataDir
    let browserId
    let browserUserDataDir
    if('browserId' in browserConfig){
      browserId = browserConfig.browserId
      if(mapBrowser.has(browserId)){
        context = mapBrowser.get(browserId)
        // TODO 检查是否有效无效则剔除
      }
      browserUserDataDir = getBrowserUserDataDir(browserId)
      console.debug(browserUserDataDir);
    }
    
    if(!context){
       // check executablePath
      let executablePath = getBrowserExecutablePath('chrome', 107, 'brave')
      if(!!executablePath){
        browserConfig.options.executablePath = executablePath
      }
      console.debug(browserConfig);

      if(!!browserUserDataDir){
        context = await playwright.chromium.launchPersistentContext(browserUserDataDir, browserConfig.options);
        mapBrowser.set(browserId, context)
      }else{
        const browser = await playwright.chromium.launch(browserConfig.options)
        context = await browser.newContext()
        mapBrowser.set(browserId, context)
      }

    }
    // goto home
    const page = await context.newPage();
    // check extensions and default page
    let indexUrl = 'https://www.sogou.com/'
    console.debug(indexUrl)
    await page.goto(indexUrl)
    await page.screenshot({path:path.join(rpaConfig.appDataPath, 'logs/1.png')})
  })().catch((error) => {
    console.error(error.message)
  })
  
}

const frontBrowser = (browserId) => {

}

const closeBrowser = (browserId) => {

}



exports = module.exports = {
  browserInit, browserInit,
  openBrowser : openBrowser,
  frontBrowser : frontBrowser,
  closeBrowser : closeBrowser,
  createBrowser : createBrowser
}