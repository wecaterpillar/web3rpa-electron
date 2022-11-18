
const playwright = require('playwright')

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


module.exports = {
    createBrowser : createBrowser
}