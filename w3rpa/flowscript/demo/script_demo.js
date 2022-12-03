const log = require('electron-log')
const browser = require('../../src/rpa/browser')
const dataUtil = require('../../src/rpa/dataUtil')

// 浏览器帮助类
// 数据帮助类，可考虑调用localAPI来同rpaServer交互

const flow_start = ({item, rpaConfig}) => {
    (async () => {
        console.debug("invoke flow_start")
        console.debug(item)
        // // 浏览器参数初始化
        // browser.browserInit(rpaConfig)
        // let browserConfig = await browser.getBrowserConfig(item['browser'])
        // // 启动浏览器
        // let context = await browser.launchBrowserContext(browserConfig)
        let context = await browser.launchBrowserContext2({browserInfo:item['browser'],rpaConfigJson:rpaConfig})
        //console.debug("context")
        //console.debug(context)
        const page = await context.newPage();
        let indexUrl = 'https://www.baidu.com/'
        //console.debug(indexUrl)
        await page.goto(indexUrl)
        //await page.screenshot({path:path.join(rpaConfig.appDataPath, 'logs/1.png')})
        // 回写数据到项目明细
        item['update_time'] = getDateTime()
        log.debug('will update item:'+ JSON.stringify(item))
        await dataUtil.updateDetailData('w3_project_account', item)
        await browser.closeBrowserContext(context)
    })()
}

exports = module.exports = {
    flow_start: flow_start
}