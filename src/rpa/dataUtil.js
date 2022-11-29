// 远程服务器交互
// 本地文件交互（包含本地数据库）
const axios = require('axios')


var rpaConfig
// TODO 
let useLocalApi = false
let localApiBase 

const init = (config) => {
    rpaConfig = config
    if( 'isLocalDev' in rpaConfig){
        useLocalApi = rpaConfig['isLocalDev']
    }
    if( 'localApi' in rpaConfig){
        localApiBase = rpaConfig['localApi']
    }
    if(useLocalApi && !localApiBase){
        localApiBase = 'http://localhost:3500'
    }    
}

/////////////////////////////////////////////////////////////
/// commmon API with w3rpa server

const getAccountCryptkey = async (params) => {
    if(useLocalApi){
        let url = localApiBase + '/api/getAccountCryptkey?w3'
        return await axios.get(url, params)
    }else{
        let {getAccountCryptkeyRemote} = require('./remoteServer')
        return await getAccountCryptkeyRemote(params)
    }
}


const  getListData = async (tableKey, queryParams = {}) => {  
    if(useLocalApi){
        let url = localApiBase + '/api/getData/'+tableKey
        return await axios.get(url, queryParams)
    }else{
        let {getListDataRemote} = require('./remoteServer')
        return await getListDataRemote(tableKey, queryParams)
    }  
}

const  getDetailData = async (tableKey, detailId) => {
    if(useLocalApi){
        let url = localApiBase + '/api/detail/'+tableKey+'/'+detailId
        return await axios.get(url)
    }else{
        let {getDetailDataRemote} = require('./remoteServer')
        return await getDetailDataRemote(tableKey, detailId)
    }
}

const updateDetailData = async (tableKey, data) => {
    if(useLocalApi){
        let url = localApiBase + '/api/form/'+tableKey
        return await axios.put(url, data)
    }else{
        let {updateDetailDataRemote} = require('./remoteServer')
        return await updateDetailDataRemote(tableKey, data)
    }   
}

const createDetailData = async (tableKey, data) => {
    if(useLocalApi){
        let url = localApiBase + '/api/form/'+tableKey
        return await axios.post(url, data)
    }else{
        let {createDetailDataRemote} = require('./remoteServer')
        return await createDetailDataRemote(tableKey, data)
    }   
}

///////////////////////////////////////////////////////////////////////////
////  specail API fro web3 RPA
const AES = require('mysql-aes')
const w3encrypt = async (str, key) => {
    return AES.encrypt(str, key)
}
const w3decrypt = async (enStr, key) => {
    return AES.decrypt(enStr, key)
}

const copyParams = ( targetJson, sourceJson, keyField) => {
    if(keyField in sourceJson){
        targetJson[keyField] = sourceJson[keyField]
    }
}

const getAccountEncryptParams = (accountInfo, inputKey) => {
    let encryptParams = {}
    // scope: 1-web3 account 2-web2 account 3-project account
    //account,salt,type,group,project,tag
    let copyFields = ['account', 'username', 'address','type','salt','group2','project_code','project','tag' ]
    for(i in copyFields){
        copyParams(encryptParams, accountInfo, copyFields[i])
    }
    if(!!inputKey){
        encryptParams['inputKey'] = inputKey
    }
    return encryptParams;
}

/**
 * 获取计划任务列表
 * @param {*} filterJson 
 * @returns 
 */
const getRpaPlanTaskList = (filterJson) => {
    // filter
    let queryParams = {}
    queryParams['pageSize'] = 100
    if(filterJson){
        Object.assign(queryParams, filterJson)
    }
    return getListData('rpa_plan_task', queryParams)
}

/**
 * 获取RPA服务器浏览器配置信息
 * @param browserId 浏览器ID 
 * @param browserKey 浏览器名称，用户数据文件夹子目录名
 * @param withProxy 是否包含代理信息
 * @returns 
 */
const getBrowserInfo = async ({browserId, browserKey, withProxy=false}) => {
    let browser
    if(!!browserId){
        browser  = await getDetailData('w3_browser', browserId)
    }
    if(!browser && !!browserKey){
        let result = await getListData('w3_browser',{'name':browserKey})
        if(result && result.records.length>0){
            browser = result.records[0]
        }
    }
    if(!!browser && !'browserKey' in browser){
        browser['browserKey'] = browser['name']
    }
    if(withProxy){
        //
    }
    return browser 
}

const getAccountInfo = async ({type, account, isWeb3 = true, encryptKey}) => {
    let accountInfo 
    if(isWeb3){
        // web3 地址唯一
        let result = await getListData('w3_account',{'address': account})
        if(!!result && result.records.length>0){
            accountInfo = result.records[0]
        } 
    }else{
        let result = await getListData('w3_account2',{'type':type, 'username': account})
        if(!!result && result.records.length>0){
            accountInfo = result.records[0]
        }
    }
    return accountInfo
}

/**
 * 获取项目明细的web2账号密码
 * @param projectItem
 * @returns {Promise<string>}
 */
const loadProjectUserPassword = async (projectItem = {}) =>{
    let passwordEncrypt = projectItem['password_encrypt']
    let password
    if(!!passwordEncrypt){
        let encryptParams = getAccountEncryptParams(projectItem)
        let encryptKey = await getAccountCryptkey(encryptParams)
        password = w3decrypt(passwordEncrypt, encryptKey)
        projectItem['password'] = password
    }
    return password
}

/**
 * 获取web2账号的密码
 * @param accountItem
 * @returns {Promise<string>}
 */
const loadAccountUserPassword = async (accountItem = {}) => {
    let passwordEncrypt = accountItem['password_encrypt']
    let password
    if(!!passwordEncrypt){
        let encryptParams = getAccountEncryptParams(accountItem)
        let encryptKey = await getAccountCryptkey(encryptParams)
        password = w3decrypt(passwordEncrypt, encryptKey)
        accountItem['password'] = password
    }
    return password
}

/**
 * 获取web3账号私钥
 * @param accountItem
 * @returns {Promise<string>}
 */
const loadAccountPrivateKey = async (accountItem = {}) => {
    let privateKeyEncrypt = accountItem['private_key_encrypt']
    let privateKey
    if(!!privateKeyEncrypt){
        let encryptParams = getAccountEncryptParams(accountItem)
        let encryptKey = await getAccountCryptkey(encryptParams)
        privateKey = w3decrypt(privateKeyEncrypt, encryptKey)
        accountItem['privateKey'] = privateKey
    }
    return privateKey
}

/**
 * 获取web3账号助记词
 * @param accountItem
 * @returns {Promise<string>}
 */
const loadAccountMnemonic = async (accountItem = {}) => {
    let mnemonicEncrypt = accountItem['mnemonic_encrypt']
    let mnemonic
    if(!!mnemonicEncrypt){
        let encryptParams = getAccountEncryptParams(accountItem)
        let encryptKey = await getAccountCryptkey(encryptParams)
        mnemonic = w3decrypt(mnemonicEncrypt, encryptKey)
        accountItem['mnemonic'] = mnemonic
    }
    return mnemonic
}

exports = module.exports = {
    dataUtilInit : init,
    getListData : getListData,
    getDetailData : getDetailData,
    updateDetailData : updateDetailData,
    createDetailData : createDetailData,
    getRpaPlanTaskList : getRpaPlanTaskList,
    getBrowserInfo: getBrowserInfo,
    getAccountInfo: getAccountInfo,
    loadProjectUserPassword: loadProjectUserPassword,
    loadAccountUserPassword: loadAccountUserPassword,
    loadAccountPrivateKey: loadAccountPrivateKey,
    loadAccountMnemonic: loadAccountMnemonic
  }