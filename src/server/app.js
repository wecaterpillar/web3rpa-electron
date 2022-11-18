const express = require('express')
const { createBrowser } = require('../browser/browser')
const app = express()
const port = 3500

const browser = require('../browser/browser')

app.get('/', (req, res) => {
  res.send('Hello World! Local API')
})

app.get('/api/browsers', (req, res) => {
  // 查看浏览器状态，可指定某个或全部
})

app.post('/api/browser/open', (req, res) => {
  // 打开浏览器
  createBrowser()
  res.send('createBrowser done')
})

app.get('/api/browser/open', (req, res) => {
  // 打开浏览器, test only
  createBrowser()
  res.send('createBrowser done')
})

app.post('/api/browser/front', (req, res) => {
  // 显示浏览器窗口(toFront)
})


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

//export { app as default };