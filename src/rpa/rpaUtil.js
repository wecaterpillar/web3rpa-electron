const log = require('electron-log')
const browserUtil = require('./browserUtil')
const dataUtil = require('./dataUtil')

exports = module.exports = {}

const flowArgs = {}
let browserConfig
let context
let page

const flowSetup = async ({item, rpaConfig}) => {

    browserUtil.browserInit(rpaConfig)
    flowArgs['rpaConfig'] = rpaConfig
    flowArgs['item'] = item

    await checkPrepareAction()
   
}
exports.flowSetup = flowSetup

const checkPrepareAction = async () => {
    // item, rpaConfig
    let item = flowArgs['item'] || {}
    if(!browserConfig){
        browserConfig = await browserUtil.getBrowserConfig(item)
    }
    if(!context){
        context = await browserUtil.launchBrowserContext(browserConfig)
    }
    if(!page){
        page = await context.newPage()
    } 
}

const flowClose =  async () => {
    // Teardown
    await browserUtil.closeBrowserContext(context)
}

exports.flowClose = flowClose

// callback 参数
// context/page  参考 https://playwright.dev/docs/api/class-fixtures
// item/rpaConfig

const flowAction = async (actionName, callback) => {
    // checkCallback
    await checkPrepareAction()
    log.debug('start action: '+actionName)
    let item = flowArgs['item'] || {}
    await callback({item, browserConfig, page, context}) 
    log.debug('complete action: '+actionName)
}

exports.flowAction = flowAction