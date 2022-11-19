const playwright = require('playwright')

const fs = require("fs")
const path = require('path');


// context pool ?

var rpaConfig
var browserDefaultExtensions = []
var browserDefaultConfig = {}

const browserInitDefaultConfig = () => {
  // extensions
  browserDefaultExtensions = [
    //path.join(rpaConfig.appDataPath, 'extensions/metamask-chrome-10.22.2.zip')   //MetaMask
  ]

  browserDefaultConfig = {
    indexUrl: 'https://www.sogou.com',  //主页地址
    userDataDir: path.join(rpaConfig.appDataPath, 'default'),
    options: {
      headless: false, //是否无头浏览器
      //slowMo: 1000,//延迟
      //executablePath: path.join(rpaConfig.appDataPath, 'lib/chrome_105/SunBrowser.app/Contents/MacOS/SunBrowser'),
      executablePath: path.join(rpaConfig.appDataPath, 'lib/chrome_107/BraveBrowser.app/Contents/MacOS/Brave Browser'),
      ignoreDefaultArgs: ['--enable-automation'],
        args: [
            '--disable-blink-features=AutomationControlled',
            `--disable-extensions-except=${browserDefaultExtensions}`,
            `--load-extension=${browserDefaultExtensions}`
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
  // test only
  //createBrowser()

  (async () => {
    var browserConfig = {}
    Object.assign(browserConfig, browserDefaultConfig)
    if(config){
      Object.assign(browserConfig, config)
    }
    console.debug(browserConfig);
    //const browser = await playwright.chromium.launch({headless:false})
    //const context = await browser.newContext()
    const context = await playwright.chromium.launchPersistentContext(browserConfig.userDataDir, browserConfig.options);
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