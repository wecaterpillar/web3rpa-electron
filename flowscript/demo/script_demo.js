const { getBrowserConfig, launchBrowserContext, closeBrowserContext, getBrowserContext} = require('../../src/rpa/browser')
const { getListData, getDetailData, updateDetailData} = require('../../src/rpa/dataUtil')

// 浏览器帮助类
// 数据帮助类，可考虑调用localAPI来同rpaServer交互

const flow_start = ({item}) => {
    (async () => {
        console.debug("invoke flow_start")
        console.debug(item)
        let browserConfig = await getBrowserConfig(item['browser'])
        let context = await launchBrowserContext(browserConfig)
        //console.debug("context")
        //console.debug(context)
        const page = await context.newPage();
        let indexUrl = 'https://www.baidu.com/'

        //loadUserPassword(item);

        //console.debug(indexUrl)
        await page.goto(indexUrl)
        //await page.screenshot({path:path.join(rpaConfig.appDataPath, 'logs/1.png')})
        await closeBrowserContext(context)
    })()  
}

exports = module.exports = {
    flow_start: flow_start
}