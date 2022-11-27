// 远程服务器交互
// 本地文件交互（包含本地数据库）
const axios = require('axios')


var rpaConfig
const init = (config) => {
    rpaConfig = config
    // token
    initMapTable();
}

const checkToken = async () => {
    if(!AUTH_TOKEN){
        // get token from main window
        AUTH_TOKEN = await rpaConfig.getLoginToken()
        console.debug(AUTH_TOKEN)
        if(!!AUTH_TOKEN){
            axios.defaults.headers.common['authorization'] = AUTH_TOKEN;
            axios.defaults.headers.common['x-access-token'] = AUTH_TOKEN;
        }
    }
}
const resetToken = async () => {
    AUTH_TOKEN = undefined
    await rpaConfig.resetLoginToken()
}

const  getListData =  (tableKey, queryParams = {}) => {  
    return getListDataRemote(tableKey, queryParams)
}

const  getDetailData =  (tableKey, detailId) => {
    return getDetailDataRemote(tableKey, detailId)
}

const updateDetailData =  (tableKey, data) => {
    return updateDetailDataRemote(tableKey, data)
}

const createDetailData =  (tableKey, data) => {
    return createDetailDataRemote(tableKey, data)
}

// TODO 增加通过localApi访问remote的机制，用于flowscript中调用
// 待调试
const  getListDataApi =  async (tableKey, queryParams = {}) => {  
    let url = 'http://localhost:3500/api/getData/'+tableKey
    return await axios.get(url, queryParams)
}

const  getDetailDataApi =  async (tableKey, detailId) => {  
    let url = 'http://localhost:3500/api/detail/'+tableKey+'/'+detailId
    return await axios.get(url)
}

const updateDetailDataApi = async (tableKey, data) => {
    let url = 'http://localhost:3500/api/form/'+tableKey
    return await axios.put(url, data)
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

// authorization 
// = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE2Njg5NDgwODQsInVzZXJuYW1lIjoiYWRtaW4ifQ.tZ9SxjNUGtzGK4n4cAu6wTf8zoFxrhHJIY1qE7IKxzU'
// 开发时可查看浏览器所传递token设置在这里，否者需要等用户登录后自动抓取
let AUTH_TOKEN 

const mapRemoteTable = new Map()
const initMapTable = () => {
    
    // onl_cgform_head

    mapRemoteTable.set('RPA项目明细', '40289f94844604be01844798772d0003')
    mapRemoteTable.set('w3_project_account', '40289f94844604be01844798772d0003')

    mapRemoteTable.set('RPA计划', '40289f94844604be01844798b95c0008')
    mapRemoteTable.set('rpa_plan_schedule', '40289f94844604be01844798b95c0008')

    mapRemoteTable.set('RPA脚本', '40289f94844604be01844798b6d40006')
    mapRemoteTable.set('rpa_flow_script', '40289f94844604be01844798b6d40006')

    mapRemoteTable.set('RPA任务', '40289f94844604be01844798ba9f0009')
    mapRemoteTable.set('rpa_plan_task', '40289f94844604be01844798ba9f0009')

    mapRemoteTable.set('RPA运行节点', 'c6509c6e7f634250bf378b0240174803')
    mapRemoteTable.set('rpa_runnode', 'c6509c6e7f634250bf378b0240174803')

    // browser 40289f94844604be0184479875490002
    mapRemoteTable.set('指纹浏览器', '40289f94844604be0184479875490002')
    mapRemoteTable.set('w3_browser', '40289f94844604be0184479875490002')

    mapRemoteTable.set('air_coingecko', '2c968084846b641501846b6415d20000')
    mapRemoteTable.set('coingecko', '2c968084846b641501846b6415d20000')

    // dev only
    // https://rpa.w3bb.cc/rpa-server/online/cgform/head/list?column=createTime&order=desc&pageNo=1&pageSize=10&copyType=0&_t=1668874840187
    // tableName -> id
    // tableTxt -> id
}

const getTableKey = (tableKey) => {
    if(!tableKey){
        return tableKey
    }
    if(tableKey in mapRemoteTable){
        tableKey = mapRemoteTable.get(tableKey)
    }
    return tableKey
}

const  getListDataRemote = async (tableKey, queryParams = {}) => {  
    //  https://rpa.w3bb.cc/rpa-server/online/cgform/api/getData/[tableId]
    let result
    if(!tableKey){
        return result
    }
    let tableId = getTableKey(tableKey)
    await checkToken()

    let queryUrl = 'https://rpa.w3bb.cc/rpa-server/online/cgform/api/getData/' + tableId + '?hasQuery=true';
    for(key in queryParams){
        queryUrl += '&'+key+'='+queryParams[key]
    }
    await axios.request({
            method: 'get',
            url: queryUrl
        }).then(function (response){
            //console.debug(response)
            if(response.status === 200 && response.data.success){
                //console.debug(response.data.result)
                result = response.data.result
            }else if(response.status === 401){
                resetToken()
                //result = getListData(listKey, pageNo, pageSize)
            }    
        }).catch(function (error){
            console.log(error)
            if(error.response.status === 401){
                resetToken()
            }
        }).finally(function (){
        })
    return result
}

const  getDetailDataRemote = async (tableKey, detailId) => {
    // https://rpa.w3bb.cc/rpa-server/online/cgform/api/detail/[tableId]/[id]
    let result
    if(!tableKey || !detailId){
        return result
    }
    let tableId = getTableKey(tableKey)
    await checkToken()

    let queryUrl = 'https://rpa.w3bb.cc/rpa-server/online/cgform/api/detail/' + tableId + '/' + detailId;

    
    await axios.request({
            method: 'get',
            url: queryUrl
        }).then(function (response){
            //console.debug(response)
            if(response.status === 200 && response.data.success){
                //console.debug(response.data.result)
                result = response.data.result
            }else if(response.status === 401){
                resetToken()
                //result = getListData(listKey, pageNo, pageSize)
            }    
        }).catch(function (error){
            console.log(error)
            if(error.response.status === 401){
                resetToken()
            }
        }).finally(function (){
        })
    return result
} 

const updateDetailDataRemote = async (tableKey, data) => {
    // https://rpa.w3bb.cc/rpa-server/online/cgform/api/form/[tableId]?tabletype=1
    let result
    if(!tableKey){
        return result
    }
    let tableId = getTableKey(tableKey)
    await checkToken()
    let queryUrl = 'https://rpa.w3bb.cc/rpa-server/online/cgform/api/form/' + tableId + '?tabletype=1';
    await axios.request({
        method: 'put',
        url: queryUrl,
        data: data
    }).then(function (response){
        if(response.status === 200){
            //console.debug(response)
            result = response
        }else if(response.status === 401){
            resetToken()
            //result = getListData(listKey, pageNo, pageSize)
        }    
    }).catch(function (error){
        console.log(error)
        if(error.response.status === 401){
            resetToken()
        }
    }).finally(function (){
    })
    return result
}

const createDetailDataRemote = async (tableKey, data) => {
    // https://rpa.w3bb.cc/rpa-server/online/cgform/api/form/[tableId]?tabletype=1
    let result
    if(!tableKey){
        return result
    }
    let tableId = getTableKey(tableKey)
    await checkToken()
    let queryUrl = 'https://rpa.w3bb.cc/rpa-server/online/cgform/api/form/' + tableId + '?tabletype=1';
    await axios.request({
        method: 'post',
        url: queryUrl,
        data: data
    }).then(function (response){
        if(response.status === 200){
            //console.debug(response)
            result = response
        }else if(response.status === 401){
            resetToken()
            //result = getListData(listKey, pageNo, pageSize)
        }    
    }).catch(function (error){
        console.log(error)
        if(error.response.status === 401){
            resetToken()
        }
    }).finally(function (){
    })
    return result
}


exports = module.exports = {
    dataUtilInit : init,
    getListData : getListData,
    getDetailData : getDetailData,
    updateDetailData : updateDetailData,
    createDetailData : createDetailData,
    getRpaPlanTaskList : getRpaPlanTaskList
  }