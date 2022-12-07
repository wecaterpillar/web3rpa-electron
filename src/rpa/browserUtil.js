const log = require('electron-log')
const playwright = require('playwright')

const fs = require("fs")
const path = require('path')

const dataUtil = require('./dataUtil')

var rpaConfig

const launchBrowserContext2 = async ({browserInfo, rpaConfigJson}) => {
    rpaConfig = rpaConfigJson
    let browserConfig = await getBrowserConfig(browserInfo)
    let context = await launchBrowserContext(browserConfig)
    return context
}

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
      bravePath = path.join(rpaConfig.appDataPath, 'lib/chrome_107/brave.exe')

      let braveDefault = "C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe"
      if(fs.existsSync(bravePath)){
          executablePath = bravePath;
      }if(fs.existsSync(braveDefault)){
          executablePath = braveDefault;
      }

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

const browserInit = (config) => {
  console.debug('browser init')
  rpaConfig = config
  // browser pool init?
}

const getBrowserConfig = async (config) => {
   // default 
    var browserConfig = {
      options: {
        headless: false, //是否无头浏览器
        ignoreDefaultArgs: ['--enable-automation']
      }
    }
    // will change with deep merge
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
    }else if('name' in browserConfig){
      browserKey = browserConfig['name']
      browserConfig['browserKey'] = browserKey
    }

    // 输入config转换为指纹的options,参考ads


    // check headless
    if(browserConfig && !('options' in browserConfig)){
      browserConfig.options = {}
    }
    if(browserConfig.options && !('headless' in browserConfig.options)){
       browserConfig.options.headless = false
    }
    log.debug('browserConfig=',browserConfig)
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

    //log.debug(browserConfig);

    return browserConfig
}

const launchBrowserContext = async (browserConfig) => {
    // load context
    let context
    let browserKey
    let browserUserDataDir
    if(!!browserConfig && 'browserKey' in browserConfig){
      browserKey = browserConfig.browserKey
      if(!!browserConfig.userDataDir){
        browserUserDataDir = browserConfig.userDataDir
      }    
    }  
    let resetFingerPrint = true
    if(!!browserUserDataDir && fs.existsSync(browserUserDataDir)){
      resetFingerPrint = false
    }
    if(resetFingerPrint){
      // TODO 待处理指纹和cookie
      // 指纹设置 userAgent
      // 载入后需要加载之前的cookie

      // 如何根据IP更新区域设置？
    }
    // TODO 检查代理配置 options.proxy

    console.debug('launchBrowserContext with browserConfig:',browserConfig);
    try{
      if(!!browserUserDataDir){
        context = await playwright.chromium.launchPersistentContext(browserUserDataDir, browserConfig.options); 
      }else{
        const browser = await playwright.chromium.launch(browserConfig.options)
        context =  await browser.newContext()
      }
    }catch(err){
      log.error(err)
    }finally{
      log.debug('lauch context with cookie:', JSON.stringify(context.cookies(),null,2))
    }

    // prepare for context event
    if(context){
      context.on('close', async (context2) =>{
         // nothing 
      })
    }
    return context
}

const actionBeforeCloseContext = async (console) => {
  try{
    // 关闭前需要保存数据
    log.debug('context close, try to save cookie')
    log.debug('cookies:'+JSON.stringify(console.cookies(),null,2))
  }catch(err){
    log.warn(err)
  }finally{
  }
}

const closeBrowserContext = async (context) => {
  // https://playwright.dev/docs/api/class-browsercontext#browser-context-close
  try{
    if(!!context){
      let browser = context.browser()
      await actionBeforeCloseContext(context)
      await context.close()
      if(!!browser){
        await  browser.close()
      }
    }
  }catch(err){
    log.warn(err)
  }
}

//////////////////////////////////////////
// 浏览器 local API 调用

// context pool
const mapBrowser = new Map();  // browserKey -> browserContext

const getBrowserContext = async (browserConfig) => {
  // load context
  let context
  let browserKey
  if(!!browserConfig && 'browserKey' in browserConfig){
    browserKey = browserConfig.browserKey
    if(mapBrowser.has(browserKey)){
      context = mapBrowser.get(browserKey)
      // TODO 检查是否有效无效则剔除
      if(context.pages().length==0){
        context = null
      }
    } 
    console.debug(browserUserDataDir);
  }
  if(!context){
    context = await launchBrowserContext(browserConfig)
    // 缓存
    mapBrowser.set(browserKey, context)
  }

  return context
}

const openBrowser = (config) => {
  (async () => {
    let browserConfig = await getBrowserConfig(config)
    let context = await getBrowserContext(browserConfig)
    await visitSogouDemo({context, browserConfig})
    await context.close()
  })()
}

const frontBrowser = (browserId) => {
  // 显示到front

}

const closeBrowser = (browserId) => {
  // 关闭浏览器
  
}


// for dev

const createBrowser = () => {
  (async () => {
    const browser = await playwright.chromium.launch({headless:false})
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.goto('https://www.baidu.com')
    await page.screenshot({path:'test1-baidu.png'})
    await browser.close()
  })()
}


exports = module.exports = {}

exports.browserInit = browserInit
exports.getBrowserConfig = getBrowserConfig
exports.launchBrowserContext = launchBrowserContext
exports.launchBrowserContext2 = launchBrowserContext2
exports.closeBrowserContext = closeBrowserContext
exports.getBrowserContext = getBrowserContext
exports.openBrowser = openBrowser
exports.frontBrowser = frontBrowser
exports.closeBrowser = closeBrowser
exports.createBrowser = createBrowser