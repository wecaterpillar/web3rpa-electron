const { getBrowserConfig, getBrowserContext} = require('../src/rpa/browser')
const { getListData, getDetailData, updateDetailData} = require('../src/rpa/dataUtil')

const xxx_start = ({item}) => {
    (async () => {
        console.debug("invoke xxx_start")
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
    xxx_start: xxx_start
}