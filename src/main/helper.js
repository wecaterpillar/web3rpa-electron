var CryptoJS = require("crypto-js");

// 读取配置文件，需要同服务器设置一致
var rpaStorageKey = 'WEB3RPA__PRODUCTION__3.4.3__COMMON__LOCAL__KEY__'
var strKey = '_11111000001111@'
var strIv = '@11111000001111_'

var cryptoKey = CryptoJS.enc.Utf8.parse(strKey);
var cryptoIv = CryptoJS.enc.Utf8.parse(strIv);

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

const getMainWindowStorageValue = async ({mainWindow, key}) => {
    let value
    await mainWindow.webContents
    .executeJavaScript('localStorage.getItem("'+key+'");', true)
    .then(result => {
      //console.debug('key='+key+',value='+result)
      value = result
    })
    return value
}

const getTokenFromMainWindow = async ({mainWindow}) => {
    let token
    // get token from main window
    let value = await getMainWindowStorageValue({mainWindow, key:rpaStorageKey})
    if(!value){
        return
    }
    let storeJson = JSON.parse(decryptAes(value))
    //console.debug(storeJson)
    if(!storeJson.value['TOKEN__'] || !storeJson.value['TOKEN__'].value){
        return
    }
    token = storeJson.value['TOKEN__'].value
    return token
}

var myMainWindow

const init = ({mainWindow}) => {
    myMainWindow = mainWindow
}

const getLoginToken = async () => {
    if(!myMainWindow){
        return
    }
    return await getTokenFromMainWindow({mainWindow:myMainWindow})
}

exports = module.exports = {
    helperInit : init,
    getLoginToken : getLoginToken
  }