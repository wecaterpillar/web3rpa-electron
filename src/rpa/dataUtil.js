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

const {getListDataRemote, getDetailDataRemote, updateDetailDataRemote, createDetailDataRemote} = require('./remoteServer')

const  getListData = async (tableKey, queryParams = {}) => {  
    if(useLocalApi){
        let url = localApiBase + '/api/getData/'+tableKey
        return await axios.get(url, queryParams)
    }
    return await getListDataRemote(tableKey, queryParams)
}

const  getDetailData = async (tableKey, detailId) => {
    if(useLocalApi){
        let url = localApiBase + '/api/detail/'+tableKey+'/'+detailId
        return await axios.get(url)
    }
    return await getDetailDataRemote(tableKey, detailId)
}

const updateDetailData = async (tableKey, data) => {
    if(useLocalApi){
        let url = localApiBase + '/api/form/'+tableKey
        return await axios.put(url, data)
    }
    return await updateDetailDataRemote(tableKey, data)
}

const createDetailData = async (tableKey, data) => {
    if(useLocalApi){
        let url = localApiBase + '/api/form/'+tableKey
        return await axios.post(url, data)
    }
    return await createDetailDataRemote(tableKey, data)
}

const getRpaPlanTaskList = (filterJson) => {
    // filter
    let queryParams = {}
    queryParams['pageSize'] = 100
    if(filterJson){
        Object.assign(queryParams, filterJson)
    }
    return getListData('rpa_plan_task', queryParams)
}

exports = module.exports = {
    dataUtilInit : init,
    getListData : getListData,
    getDetailData : getDetailData,
    updateDetailData : updateDetailData,
    createDetailData : createDetailData,
    getRpaPlanTaskList : getRpaPlanTaskList
  }