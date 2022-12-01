var CryptoJS = require("crypto-js")

// 读取配置文件，需要同服务器设置一致
var rpaStorageKey = 'WEB3RPA__PRODUCTION__3.4.3__COMMON__LOCAL__KEY__'
var strKey = '_11111000001111@'
var strIv = '@11111000001111_'

var cryptoKey = CryptoJS.enc.Utf8.parse(strKey)
var cryptoIv = CryptoJS.enc.Utf8.parse(strIv)


const encryptAes = (str) =>{
    var encrypted = CryptoJS.AES.encrypt(str, cryptoKey, {
        iv: cryptoIv,
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
    })
    encrypted = encrypted.toString()
    return encrypted
}

const decryptAes = (encrypted) => {
    var decrypted = CryptoJS.AES.decrypt(encrypted, cryptoKey, {
        iv: cryptoIv,
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
    })
    decrypted = CryptoJS.enc.Utf8.stringify(decrypted)
    return decrypted
}

const encryptMd5 = (str) => {
    return CryptoJS.MD5(str).toString()
}

const getMainWindowStorageValue = async ({mainWindow, key}) => {
    let value
    // check localStorage
    await mainWindow.webContents
    .executeJavaScript('localStorage.getItem("'+key+'");', true)
    .then(result => {
      //console.debug('key='+key+',value='+result)
      value = result
    })
    // check sessionStorage
    if(!value){
        await mainWindow.webContents
        .executeJavaScript('sessionStorage.getItem("'+key+'");', true)
        .then(result => {
        value = result
        })
    }
    return value
}

var myMainWindow

const init = ({mainWindow}) => {
    myMainWindow = mainWindow
}

const getValueFromMainWindowStorage = async (key) => {
    if(!myMainWindow){
        return
    }
    return await getMainWindowStorageValue({mainWindow:myMainWindow, key})
}

const getAppCurrentUser = async () => {
    let userInfo = {}
    if(!myMainWindow){
        return userInfo
    }
    mainWindow = myMainWindow   
    let value = await getMainWindowStorageValue({mainWindow, key:rpaStorageKey})
    if(!!value){
        let storeJson = JSON.parse(decryptAes(value))
        //console.debug(storeJson)
        // username
        if(storeJson.value['USER__INFO__'] && storeJson.value['USER__INFO__'].value){
            let username = storeJson.value['USER__INFO__'].value['username']
            userInfo['username'] = username
            userInfo['userid'] = storeJson.value['USER__INFO__'].value['id']
        }
        // token
        if(storeJson.value['TOKEN__'] && storeJson.value['TOKEN__'].value){
            let token = storeJson.value['TOKEN__'].value
            userInfo['token'] = token
        }   
    }   
    // check other
    let hostname = await getMainWindowStorageValue({mainWindow, key:'hostname'})
    if(!!hostname){
        userInfo['hostname'] = hostname
    }   
    return userInfo
}


exports = module.exports = {
    helperInit : init,
    encryptMd5: encryptMd5,
    getValueFromMainWindowStorage: getValueFromMainWindowStorage,
    getAppCurrentUser : getAppCurrentUser
  }