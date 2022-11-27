const fs = require("fs")
const path = require('path')

// 兼容两种场景
// 场景1-electron中运行
// 场景2-RPA流程脚本开发

const rpaConfig = {}

const loadRpaConfigDev = async () => {
    let  rpaConfig
    // load rpaConfig from dev.json
    await (async () => {
        let configPath = './dev.json'
        if (fs.existsSync(configPath)) {
            let configStr = fs.readFileSync(configPath)
            rpaConfig = JSON.parse(configStr)
        }
    })()
    return rpaConfig
}

exports = module.exports = {
    rpaConfig : rpaConfig
}