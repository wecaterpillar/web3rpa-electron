const express = require('express')
const app = express()
const port = 3500


const remoteServer = require('../help/remoteServer')
const browserUtil = require('./browserUtil')


var bodyParser = require('body-parser')
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))

app.get('/', (req, res) => {
  res.send('Hello World! Local API')
})

app.get('/status', (req, res) => {
  res.send('success')
})

app.post('/api/getAccountCryptkey', async (req, res) => {
  let key = await remoteServer.getAccountCryptkeyRemote(req.body)
  res.send(key)
})

app.get('/api/getData/:tableKey', async (req, res) => {
  let tableKey = req.params.tableKey
  let result = await remoteServer.getListDataRemote(tableKey, req.query)
  res.json(result)
})

app.post('/api/getData/:tableKey', async (req, res) => {
  let tableKey = req.params.tableKey
  let result = await remoteServer.getListDataRemote(tableKey, req.body)
  res.json(result)
})

app.get('/api/detail/:tableKey/:id', async (req, res) => {
  let tableKey = req.params.tableKey
  let id = req.params.id
  let result = await remoteServer.getDetailDataRemote(tableKey, id)
  res.json(result)
})

app.put('/api/form/:tableKey', async (req, res) => {
  let tableKey = req.params.tableKey
  let data = req.body
  let result = await remoteServer.updateDetailDataRemote(tableKey, data)
  res.json(result)
})

app.post('/api/form/:tableKey', async (req, res) => {
  let tableKey = req.params.tableKey
  let data = req.body
  let result = await remoteServer.createDetailDataRemote(tableKey, data)
  res.json(result)
})

app.get('/api/check', (req, res) => {
  res.send('1')
})

app.get('/api/get-visitor-ip', async (req, res) => {
  let result = await remoteServer.getVisitorIpRemote()
  res.json(result)
})

app.get('/api/rand-user-agent', async (req, res) => {
  let result = await remoteServer.getRandUserAgentRemote(req.query)
  res.json(result)
})

app.get('/api/getLocalBrowser', async (req, res) => {
  // 获取本地browser chrome/firefox 以及支持版本
  // {"code":0,"data":{"chrome":["105"],"firefox":[]},"msg":"success"}
  // 检查目录 /lib下 浏览器， 例如 chrome_107
  let result = {}
  result.set("chrome", 0, "107")
  return res.json(result)
})

app.get('/api/getProxy', async (req, res) => {
  // 获取proxy本地验证结果
  // {"code":0,"data":{"list":[],"crash_ids":[]},"msg":"查询成功"}
})

app.get('/api/browsers', async (req, res) => {
  // 查看浏览器状态，可指定某个或全部
})

app.post('/api/browser/open', async (req, res) => {
  // 打开浏览器
  let config = {}
  let browserKey = req.query['key']
  // req.body => json
  config['browserKey'] = browserKey
  config['browser'] = req.body 
  browserUtil.openBrowser(config)
  res.send('createBrowser done')
})

app.post('/api/browser/front', async (req, res) => {
  // 显示浏览器窗口(toFront)
})


// for test
app.get('/api/browser/open', async (req, res) => {
  // 打开浏览器, test only
  browserUtil.openBrowser(req.query)
  res.send('createBrowser done')
})


app.listen(port, () => {
  console.log(`local API server listening on port ${port}`)
})

exports = module.exports = () => {
  return this
}
