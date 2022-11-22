const { getBrowserConfig, getBrowserContext} = require('../src/rpa/browser')
const { getListData, getDetailData, updateDetailData} = require('../src/rpa/dataUtil')

const flow_start = ({item}) => {
    (async () => {
        console.debug("invoke flow_start")
        console.debug(item)
        let browserConfig = await getBrowserConfig(item['browser'])
        let context = await getBrowserContext(browserConfig)
        console.debug("context")
        console.debug(context)
        const page = await context.newPage();
        let indexUrl = 'https://www.baidu.com/'
        console.debug(indexUrl)
        await page.goto(indexUrl)
        // await page.screenshot({path:path.join(rpaConfig.appDataPath, 'logs/1.png')})
    })()  
}

exports = module.exports = {
    flow_start: flow_start
}