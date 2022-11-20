const express = require('express')
const app = express()
const port = 3500

const {openBrowser, frontBrowser, closeBrowser} = require('./browser')
const {getListData, getCoingeckoListData} = require('./dataUtil')

var bodyParser = require('body-parser')
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))

app.get('/', (req, res) => {
  res.send('Hello World! Local API')
})

app.get('/api/browsers', async (req, res) => {
  // 查看浏览器状态，可指定某个或全部
})

app.post('/api/browser/open', async (req, res) => {
  // 打开浏览器
  // req.body => json
  openBrowser({})
  res.send('createBrowser done')
})

app.post('/api/browser/front', async (req, res) => {
  // 显示浏览器窗口(toFront)
})


// for test
app.get('/api/browser/open', async (req, res) => {
  // 打开浏览器, test only
  let browserId = req.query.browserId
  if(!browserId){
    browserId = 'a001'
  }
  openBrowser({'browserId':browserId})
  res.send('createBrowser done')
})

app.get('/api/getCoingeckoData', async (req, res) => {
  // test only
    let listKey = req.query.listKey
    let result =  await getCoingeckoListData(1, 100)
    console.debug(result)
    res.json(result)
})



app.listen(port, () => {
  console.log(`local API server listening on port ${port}`)
})


exports = module.exports = () => {
  return this
}
