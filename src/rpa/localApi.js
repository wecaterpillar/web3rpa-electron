const express = require('express')
const app = express()
const port = 3500


const remoteServer = require('../help/remoteServer')
const browser = require('./browser')


var bodyParser = require('body-parser')
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))

app.get('/', (req, res) => {
  res.send('Hello World! Local API')
})

app.post('/api/getAccountCryptkey', async (req, res) => {
  let key = await remoteServer.getAccountCryptkeyRemote(req.body)
  res.send(key)
})

app.get('/api/getData/:tableKey', async (req, res) => {
  let tableKey = req.params.tableKey
  let result = await remoteServer.getListDataRemote(tableKey, req.body)
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



app.get('/api/browsers', async (req, res) => {
  // 查看浏览器状态，可指定某个或全部
})

app.post('/api/browser/open', async (req, res) => {
  // 打开浏览器
  // req.body => json
  browser.openBrowser({})
  res.send('createBrowser done')
})

app.post('/api/browser/front', async (req, res) => {
  // 显示浏览器窗口(toFront)
})


// for test
app.get('/api/browser/open', async (req, res) => {
  // 打开浏览器, test only
  browser.openBrowser(req.query)
  res.send('createBrowser done')
})


app.listen(port, () => {
  console.log(`local API server listening on port ${port}`)
})


exports = module.exports = () => {
  return this
}
