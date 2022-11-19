const express = require('express')
const app = express()
const port = 3500

const {openBrowser, frontBrowser, closeBrowser} = require('./browser')

app.get('/', (req, res) => {
  res.send('Hello World! Local API')
})

app.get('/api/browsers', (req, res) => {
  // 查看浏览器状态，可指定某个或全部
})

app.post('/api/browser/open', (req, res) => {
  // 打开浏览器
  res.send('createBrowser done')
})

app.get('/api/browser/open', (req, res) => {
  // 打开浏览器, test only
  openBrowser({'browserId':'a001'})
  res.send('createBrowser done')
})

app.post('/api/browser/front', (req, res) => {
  // 显示浏览器窗口(toFront)
})


app.listen(port, () => {
  console.log(`local API server listening on port ${port}`)
})

exports = module.exports = () => {
  return this
}
