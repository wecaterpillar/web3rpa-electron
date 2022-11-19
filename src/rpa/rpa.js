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




const rpaConfig = {}

const startRpa = () => {
    console.debug('start rpa ...')
    console.debug(rpaConfig)
    loadLocalApi()
}


// localAPI server
var localApi
const loadLocalApi = () => {
  localApi = require("./localApi")
}



exports = module.exports = {
    rpaConfig: rpaConfig,
    startRpaServer: startRpa
};