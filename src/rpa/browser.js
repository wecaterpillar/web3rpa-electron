const playwright = require('playwright')

const fs = require("fs")
const path = require('path')


// context pool
const mapBrowser = new Map();  // browserKey -> browserContext

var rpaConfig
var browserDefaultConfig = {}

const getBrowserExtensions = (extensions) => {
  // TODO 插件配置检查,以及配置文件是否存在
  // 插件服务下载后解压
  // https://playwright.dev/docs/chrome-extensions
  var  browserExtensions = [
    //path.join(rpaConfig.appDataPath, 'lib/extensions/metamask-chrome-10.22.2')   //MetaMask
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
    let bravePath = path.join(rpaConfig.appDataPath, 'lib/chrome_107/BraveBrowser.app/Contents/MacOS/Brave Browser')
    // 2 playwright默认配置
    // ~/Library/Caches/ms-playwright/chromium-1028/chrome-mac/Chromium.app
    // 3 系统默认配置
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

const getBrowserUserDataDir = (browserKey) => {
  // 默认目录如何处理，固定default或者不指定
  if(!!browserKey){
    return path.join(rpaConfig.appDataPath, '/userData/'+browserKey)
  }
  return
}

const browserInitDefaultConfig = () => {
  browserDefaultConfig = {
    indexUrl: 'https://www.sogou.com',  //主页地址
    options: {
      headless: false, //是否无头浏览器
      ignoreDefaultArgs: ['--enable-automation']
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
const getBrowserConfig = async (config) => {
    var browserConfig = {}
    Object.assign(browserConfig, browserDefaultConfig)
    if(config){
      Object.assign(browserConfig, config)
    }
    // check browserKey/browserId
    let browserKey 
    if('browserKey' in browserConfig){
      browserKey = browserConfig['browserKey']
    }else if('browserId' in browserConfig){
      browserKey = browserConfig['browserId']
      browserConfig['browserKey'] = browserKey
    }

    // 输入config转换为指纹的options,参考ads


    // check headless
    browserConfig.options.headless = false

    // check extension
    let extensions = getBrowserExtensions()
    if(!!extensions && extensions.length>0){
      browserConfig.options.args = [
              '--disable-blink-features=AutomationControlled',
              `--disable-extensions-except=${extensions}`,
              `--load-extension=${extensions}`
        ]
    }else{
      browserConfig.options.args = ['--disable-blink-features=AutomationControlled']
    }

    // check executablePath
    let executablePath = getBrowserExecutablePath('chrome', 107, 'brave')
    if(!!executablePath){
      browserConfig.options.executablePath = executablePath
    }

    // check browserUserDataDir
    let browserUserDataDir = getBrowserUserDataDir(browserKey)
    if(!!browserUserDataDir){
      browserConfig.userDataDir = browserUserDataDir
    }

    console.debug(browserConfig);

    return browserConfig
}
const getBrowserContext =  async (browserConfig) => {
    // load context
    let context
    
    // 根据browserKey检查是否有同key的browser正在运行
    // check browserKey and browserUserDataDir
    let browserKey
    let browserUserDataDir
    if('browserKey' in browserConfig){
      browserKey = browserConfig.browserKey
      if(mapBrowser.has(browserKey)){
        context = mapBrowser.get(browserKey)
        // TODO 检查是否有效无效则剔除
        if(context.pages().length==0){
          context = null
        }
      }
      if(!!browserConfig.userDataDir){
        browserUserDataDir = browserConfig.userDataDir
      }    
      console.debug(browserUserDataDir);
    }
    
    if(!context){
      console.debug(browserConfig);
      (async () => {
        if(!!browserUserDataDir){
          context = await playwright.chromium.launchPersistentContext(browserUserDataDir, browserConfig.options); 
          mapBrowser.set(browserKey, context)
        }else{
          const browser = await playwright.chromium.launch(browserConfig.options)
          context = await browser.newContext()
          mapBrowser.set(browserKey, context)
        }
      })()    
    }
    return context
}

const openBrowser = async (config) => {

  let browserConfig = await getBrowserConfig(config)
  let context = await getBrowserContext(browserConfig)
  await visitSogouDemo({context, browserConfig})
  // context.close()

}

const visitSogouDemo = async ({context, browserConfig}) => {
   // goto home

   const page = await context.newPage();
   // check extensions and default page
   let indexUrl = 'https://www.sogou.com/'
   console.debug(indexUrl)
   await page.goto(indexUrl)
   await page.screenshot({path:path.join(rpaConfig.appDataPath, 'logs/1.png')})
}

const frontBrowser = (browserId) => {
  // 显示到front

}

const closeBrowser = (browserId) => {
  // 关闭浏览器
  
}



exports = module.exports = {
  browserInit: browserInit,
  getBrowserConfig : getBrowserConfig,
  getBrowserContext : getBrowserContext,
  openBrowser : openBrowser,
  frontBrowser : frontBrowser,
  closeBrowser : closeBrowser,
  createBrowser : createBrowser
}