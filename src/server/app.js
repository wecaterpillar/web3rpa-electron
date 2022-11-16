const express = require('express')
const app = express()
const port = 3500

app.get('/', (req, res) => {
  res.send('Hello World! Local API')
})

app.get('/api/browsers', (req, res) => {
  // 查看浏览器状态，可指定某个或全部
})

app.post('/api/openBrowser', (req, res) => {
  // 打开浏览器
})

app.post('/api/frontBrowser', (req, res) => {
  // 显示浏览器窗口(toFront)
})


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

//export { app as default };