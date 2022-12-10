const log = require('electron-log')
const browserUtil = require('../../dist/rpa/browserUtil')
const dataUtil = require('../../dist/rpa/dataUtil')
const {flowAction, flowSetup, flowClose} = require('../../dist/rpa/rpaUtil')

const flow_start = async ({item, rpaConfig}) => {
    // first step
    await flowSetup({item, rpaConfig})

    // more actions
    await flowAction('your name', async({item, page, context})=>{
        let indexUrl = 'https://www.baidu.com/'
        //console.debug(indexUrl)
        await page.goto(indexUrl)
        //await page.screenshot({path:path.join(rpaConfig.appDataPath, 'logs/1.png')})
        // 回写数据到项目明细
        item['update_time'] = dataUtil.getDateTime()
        log.debug('will update item:'+ JSON.stringify(item))
        if('id' in item){
            await dataUtil.updateDetailData('w3_project_account', item)
        }
    })

    // last step
    await flowClose()
}

const flow_start1 = async ({item, rpaConfig}) => {
        log.debug("invoke flow_start")
        //log.debug(item)
        dataUtil.dataUtilInit(rpaConfig)
        // // 浏览器参数初始化
        // browser.browserInit(rpaConfig)
        // let browserConfig = await browser.getBrowserConfig(item['browser'])
        // // 启动浏览器
        // let context = await browser.launchBrowserContext(browserConfig)
        let context = await browserUtil.launchBrowserContext2({browserInfo:item,rpaConfigJson:rpaConfig})
        //console.debug("context")
        //console.debug(context)
        const page = await context.newPage();
        let indexUrl = 'https://www.baidu.com/'
        //console.debug(indexUrl)
        await page.goto(indexUrl)
        //await page.screenshot({path:path.join(rpaConfig.appDataPath, 'logs/1.png')})
        // 回写数据到项目明细
        item['update_time'] = dataUtil.getDateTime()
        log.debug('will update item:'+ JSON.stringify(item))
        if('id' in item){
            await dataUtil.updateDetailData('w3_project_account', item)
        }
        await browserUtil.closeBrowserContext(context)
        log.debug('task flow complete')
        return 0
}

exports = module.exports = {
    flow_start: flow_start
}