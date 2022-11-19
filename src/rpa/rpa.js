// base_path
// user_data

// getbrowserpath: chrome 105

// browser fingerprint config
// proxy config
// cookie

// launch browser
// debug 
// DevTools listening on ws://127.0.0.1:60163/devtools/browser/1ac46d43-2dbf-49ad-a95c-9e7a30f0c553

const playwright = require('playwright')
console.debug("rpa load playwright")

const { browserInit, openBrowser, frontBrowser, closeBrowser} = require('./browser')


const rpaConfig = {}

const startRpa = () => {
    console.debug('start rpa ...')
    console.debug(rpaConfig)
    browserInit(rpaConfig)
    loadLocalApi()
}


// localAPI server
var localApi
const loadLocalApi = () => {
  localApi = require("./localApi")
}

// RPA 计划
// 1 获取分配给当前节点的计划任务，启用本地定时任务
// 2 检查本地分配任务或者远程分配任务，并维护状态
// 3 执行任务脚本-获取脚本，获取账号，执行任务，更新结果

exports = module.exports = {
    rpaConfig: rpaConfig,
    startRpaServer: startRpa
};