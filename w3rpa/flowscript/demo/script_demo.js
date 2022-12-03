const { browserInit, getBrowserConfig, launchBrowserContext, closeBrowserContext} = require('../../src/rpa/browser')
const { getListData, getDetailData, updateDetailData, getDateTime} = require('../../src/rpa/dataUtil')

// 浏览器帮助类
// 数据帮助类，可考虑调用localAPI来同rpaServer交互

const flow_start = ({item, rpaConfig}) => {
    (async () => {
        console.debug("invoke flow_start")
        console.debug(item)
        browserInit(rpaConfig)
        let browserConfig = await getBrowserConfig(item['browser'])
        let context = await launchBrowserContext(browserConfig)
        //console.debug("context")
        //console.debug(context)
        const page = await context.newPage();
        let indexUrl = 'https://www.baidu.com/'
        //console.debug(indexUrl)
        await page.goto(indexUrl)
        //await page.screenshot({path:path.join(rpaConfig.appDataPath, 'logs/1.png')})
        item['update_time'] = getDateTime()
        await updateDetailData('w3_project_account', item)
        await closeBrowserContext(context)
    })()
}

exports = module.exports = {
    flow_start: flow_start
}