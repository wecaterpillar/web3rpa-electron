const log = require('electron-log')
const playwright = require('playwright')

const fs = require("fs")
const path = require('path')

const dataUtil = require('./dataUtil')

exports = module.exports = {}

var rpaConfig

const launchBrowserContext2 = async ({item, rpaConfig, browserInfo, rpaConfigJson}) => {
    // 兼容旧版本参数 rpaConfigJson
    if(!rpaConfig && !!rpaConfigJson){
      rpaConfig = rpaConfigJson
    }
    // 兼容旧版本参数 browserInfo
    if(!item && !! browserInfo){
      item = browserConfig
    }    

    browserInit(rpaConfig)
    let browserConfig = await getBrowserConfig(item)
    let context = await launchBrowserContext(browserConfig)
    return context
}

exports.launchBrowserContext2 = launchBrowserContext2

const getBrowserExtensions = (extensions) => {

  // 获取浏览器和项目配置的插件清单
  // 检查本地是否存在插件

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
    let bravePath = path.join(rpaConfig.appDataPath, 'lib/chrome_107/Brave Browser.app/Contents/MacOS/Brave Browser')
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

  // 1 基础参数prepare
    // 1.1， set default 
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

    // 1.2. 检查浏览器配置
    let  browser = config
    // 兼容传入参数为 item 或 item['browser']
    if(config && 'browser' in config){
      browser = config['browser']
    }
    config['browser'] = browser    


    // 1.3 检查 options 参数，用于启动browser
    if(browserConfig && !('options' in browserConfig)){
      browserConfig.options = {}
    }

    // check headless
    if(browserConfig.options && !('headless' in browserConfig.options)){
      browserConfig.options.headless = false
    }     

    // 1.4. check browserKey/browserId
    let browserKey 
    if('browserKey' in browserConfig){
      browserKey = browserConfig['browserKey']
    }else if('browserId' in browserConfig){
      browserKey = browserConfig['browserId']
      browserConfig['browserKey'] = browserKey
    }
    if(!browserKey && browser['name']){
      browserKey = browser['name']
      browserConfig['browserKey'] = browserKey
    }

    // 2. 读取配置及准备

    // 2.2 获取指纹配置，并检查userAgent
    let fingerprint = {}   
    // 检查 userAgent
    let ua 
    if(browser && browser['ua']){
      ua = browser['ua']
    }

    // 指纹设置  低优先级，因为brave已经做了隐私处理   
    if(browser && browser['fingerprint_json']){
      fingerprint = JSON.parse(browser['fingerprint_json'])
      log.debug('fingerprint',fingerprint)
      if(!ua && fingerprint['ua']){
        ua = fingerprint['ua']
        browser['ua'] = ua
        browser['ua_changed'] = 1
      }
    }

    // 输入config转换为指纹的options,参考ads
    // http://apidoc.adspower.net/localapi/local-api-v1.html#fingerprintConfig

    //https://playwright.dev/docs/api/class-browsertype#browser-type-launch
    //https://playwright.dev/docs/api/class-browsertype#browser-type-launch-persistent-context
    //--headless 无头模式
    //--disable-gpu 禁用GPU加速
    //--incognito 隐身模式
    //--blink-settings=imagesEnabled=false 禁止图片加载 
    //--disable-notifications 禁用通知
    //--disable-blink-features=AutomationControlled 隐藏webDriver
    

    // 2.3 隐私保护/自动录入等
    // autofill
    // brave  Password Manager default
    // Offer to save passwords 
    // Auto Sign-in
    
    // clear_cache_after_closing 关闭浏览器后是否清除缓存 0:否（默认）1:是
    // disable_password_filling 是否禁用填充账密功能 0:否（默认）1:是
    // enable_password_saving 是否允许保存密码 0:否（默认）1:是

    // 2.4 代理设置
    // http://apidoc.adspower.net/localapi/local-api-v1.html#userProxyConfig
    let proxyconfig = {}
    if(browser && browser['proxy_json']){
      proxyconfig = JSON.parse(browser['proxy_json'])
      log.debug(proxyconfig)
    }

    // 2.6 流量优化
    // 减少代理流量
    // 如果设置代理，需要设置bypass
    // 通用cdn、第三方资源、静态资源域名规则等


    //log.debug('browserConfig=',browserConfig)

    // 3 参数检查及设置
    // 3.1 默认设置
    browserConfig.options.args = ['--disable-blink-features=AutomationControlled',
            '--no-default-browser-check','--no-first-run']

    // 3.2 check executablePath
    // 需要先检查当前环境有哪些可用浏览器
    let executablePath = getBrowserExecutablePath('chrome', 107, 'brave')
    if(!!executablePath){
      browserConfig.options.executablePath = executablePath
    }

    // 3.3 check browserUserDataDir
    let browserUserDataDir = getBrowserUserDataDir(browserKey)
    if(!!browserUserDataDir){
      browserConfig.userDataDir = browserUserDataDir
    }    

    // 3.4 check extension
    let extensions = getBrowserExtensions()
    if(!!extensions && extensions.length>0){
      browserConfig.options.args.push(`--disable-extensions-except=${extensions}`,
              `--load-extension=${extensions}`)
    } 

    // 3.5 user agent
    // args [--user-agent=]  (launch.options)
    // https://peter.sh/experiments/chromium-command-line-switches/
    // userAgent (launchPersistentContext.options)
    if(!ua){
       // 如无browserUserDataDir需要强制设置ua
      if(!browserUserDataDir){
        // 服务器获取随机ua值
        let system = 'Windows'
        if(rpaConfig.isMac){
          system = 'Mac OS X'
        }else if(rpaConfig.isLinux){
          system = 'Linux'
        }
        ua = dataUtil.getRandUserAgent({"system":system,"browser":"brave"})
        if(!!ua){
          browser['ua'] = ua
        }
      }    
    }
    if(!!ua){
      browserConfig.options.args.push('--user-agent='+ua)
      if(!!browserUserDataDir){
        browserConfig.options['userAgent'] = ua
      }
    }

    // 3.6 cookie 
    // 仅需要在重新生成用户目录时设置
    let cookie
    if(browser && browser['cookie']){
      cookie = JSON.parse(browser['cookie'])
      //log.debug(cookie)
    }

    // 3.7 
    // 如何根据IP更新区域设置？
        

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
    
    console.debug('launchBrowserContext with browserConfig:',browserConfig);
    try{
      if(!!browserUserDataDir){
        context = await playwright.chromium.launchPersistentContext(browserUserDataDir, browserConfig.options); 
      }else{
        let browser = await playwright.chromium.launch(browserConfig.options)
        context =  await browser.newContext()
      }
    }catch(err){
      log.error('launch error',err)
    }finally{
    }

    // prepare for context event
    if(context){
      context.on('close', async (context2) =>{
         // nothing 
         console.debug('in voke on close')
      })
    }
    return context
}

const newPage = async (context) => {
  try{
    if(!!context){
      let page = await context.newPage()
      await page.addInitScript( {path: path.join(rpaConfig.appDataPath,'dist/rpa/preload.js')})
      return page
    }
  }catch( err){
    log.warn(err)
  }
}

exports.newPage = newPage

const actionBeforeCloseContext = async (context, item = {}) => {
  try{
    log.debug('actionBeforeCloseContext befor context close')
    // 1. 业务数据检查？

    // 2. 检查browser
    let browser = item['browser']
    if(!browser){
      return
    }
    // 2.1 ua
    let page
    if(!!context.pages()){
      page = context.pages()[0]
    }else{
      page = await newPage(context)
    }
    let navigator = {}
    navigator['userAgent'] = await page.evaluate( ()=> navigator.userAgent)
    navigator['platform'] = await page.evaluate( ()=> navigator.platform)
    navigator['oscpu'] = await page.evaluate( ()=> navigator.oscpu)
    navigator['language'] = await page.evaluate( ()=> navigator.language)
    log.debug('navigator=', navigator)
    let ua = browser['ua']
    if(!ua){
      // 更新ua 
      if(browser['fingerprint_json']){
        fingerprint = JSON.parse(browser['fingerprint_json'])
        if(fingerprint['ua']){
          ua = fingerprint['ua']
          browser['ua'] = ua
        }
      }
      // 获取当前ua后更新
      if(!ua){
          ua = await page.evaluate( ()=> navigator.userAgent)
          browser['ua'] = ua
      }
    }
    // 2.2 cookie
    let cookie = JSON.stringify(context.cookies(),null,2)
    //log.debug('cookies:'+cookie)
    if(!!cookie && cookie.length>3){
      browser['cookie'] = cookie
    }
    // 2.3 ip/country/city
    
    // 2.9 更新数据
    dataUtil.updateDetailData('w3_browser',item['browser'])

  }catch(err){
    log.warn('error in actionBeforeCloseContext',err)
  }finally{
  }
}

const closeBrowserContext = async (context, item = {}) => {
  // https://playwright.dev/docs/api/class-browsercontext#browser-context-close
  try{
    if(!!context){
      let browser = context.browser()
      await actionBeforeCloseContext(context, item)
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
      if(!!context && context.pages().length==0){
        context = null
      }
    } 
    //console.debug(browserUserDataDir);
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
    //await visitSogouDemo({context, browserConfig})
    //await context.close()
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




exports.browserInit = browserInit
exports.getBrowserConfig = getBrowserConfig
exports.launchBrowserContext = launchBrowserContext
exports.closeBrowserContext = closeBrowserContext
exports.getBrowserContext = getBrowserContext
exports.openBrowser = openBrowser
exports.frontBrowser = frontBrowser
exports.closeBrowser = closeBrowser
exports.createBrowser = createBrowser