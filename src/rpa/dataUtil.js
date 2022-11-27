// 远程服务器交互
// 本地文件交互（包含本地数据库）
const axios = require('axios')


var rpaConfig
// TODO 
const useLocalApi = false
let localApiBase 

const init = (config) => {
    rpaConfig = config

    if( 'localApi' in rpaConfig){
        localApiBase = rpaConfig['localApi']
    }
    if(useLocalApi && !localApiBase){
        localApiBase = 'http://localhost:3500'
    }    
}

/////////////////////////////////////////////////////////////
/// commmon API with w3rpa server

const w3encrypt = async ({str, salt, key}) => {
    if(useLocalApi){
        let url = localApiBase + '/api/w3encrpt'
        let queryParams = {}
        queryParams['str'] = str
        queryParams['salt'] = salt
        queryParams['key'] = key
        return await axios.get(url, queryParams)
    }else{
        
    }
}
const w3decrypt = async ({str, salt, key}) => {
    if(useLocalApi){
        let url = localApiBase + '/api/w3decrpt'
        let queryParams = {}
        queryParams['str'] = str
        queryParams['salt'] = salt
        queryParams['key'] = key
        return await axios.get(url, queryParams)
    }else{
        
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

const getAccountInfo = async ({type, account, isWeb3 = true, withDecrypt = false, encryptKey}) => {
    let accountInfo 
    if(isWeb3){
        // web3 地址唯一
        let result = await getListData('w3_account',{'address': account})
        if(!!result && result.records.length>0){
            accountInfo = result.records[0]
        }
        if(!!accountInfo && withDecrypt && !!encryptKey){
            let salt = accountInfo['salt']
            //助记 mnemonic_encrypt
            //私钥 private_key_encrypt
        }
        
    }else{
        let result = await getListData('w3_account2',{'type':type, 'username': account})
        if(!!result && result.records.length>0){
            accountInfo = result.records[0]
        }
        if(!!accountInfo && withDecrypt && !!encryptKey){
            //密码
        }
    }
    return accountInfo
}

exports = module.exports = {
    dataUtilInit : init,
    getListData : getListData,
    getDetailData : getDetailData,
    updateDetailData : updateDetailData,
    createDetailData : createDetailData,
    getRpaPlanTaskList : getRpaPlanTaskList,
    getBrowserInfo: getBrowserInfo
  }