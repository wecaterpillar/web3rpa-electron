// 远程服务器交互
// 本地文件交互（包含本地数据库）


// 用户登录后返回token
// WEB3RPA__PRODUCTION__3.4.3__LOCALE__  需要AES解密
// encryptionSetting  cacheCipher key=_11111000001111@ iv=@11111000001111_
// XY8ARvT6/tsT/aFej3NMfEaT9GptibnT4r+nfF6IK+TGUHDfoXrZ2FBMtTXFEiYO/bBaDhxCGeZagplGCOOT/GiiwXZaIsJKAAOhDOelold9T3Y+lH4SuZGwr9moltClDo+cBxcubJW/mQZb8vGFL8JvBFkhQdm094nlaVTJIQxb1xzL6zE4xYFVRpJvp5e5
// x-access-token
// authorization: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE2Njg4NzYwNTksInVzZXJuYW1lIjoiYWRtaW4ifQ.lkMSSbDVtxbla47S47PatCO8hjBhLf_QLH_swZfldpw
// 获取服务器信息
// https://rpa.w3bb.cc/rpa-server/online/cgform/api/getData/2c968084846b641501846b6415d20000?hasQuery=true&column=id&order=asc&pageNo=1&pageSize=100&_t=1668873758489

const axios = require('axios')

// 服务器配置
 // authorization 
let AUTH_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE2Njg5MTI4NjAsInVzZXJuYW1lIjoiYWRtaW4ifQ.ieLawIFToZnMGURJ0V_m741b0fVQrBQi54HJb2vSbZw'
axios.defaults.headers.common['authorization'] = AUTH_TOKEN;
axios.defaults.headers.common['x-access-token'] = AUTH_TOKEN;
axios.defaults.headers.common['referer'] = 'https://rpa.w3bb.cc';

const mapRemoteTable = new Map()
const initMapTable = () => {
    
    mapRemoteTable.set('RPA计划', '40289f94844604be01844798b95c0008')
    mapRemoteTable.set('rpa_plan_schedule', '40289f94844604be01844798b95c0008')

    mapRemoteTable.set('RPA脚本', '40289f94844604be01844798b6d40006')
    mapRemoteTable.set('rpa_flow_script', '40289f94844604be01844798b6d40006')

    mapRemoteTable.set('RPA任务', '40289f94844604be01844798ba9f0009')
    mapRemoteTable.set('rpa_plan_task', '40289f94844604be01844798ba9f0009')

    mapRemoteTable.set('RPA运行节点', 'c6509c6e7f634250bf378b0240174803')
    mapRemoteTable.set('rpa_runnode', 'c6509c6e7f634250bf378b0240174803')

    mapRemoteTable.set('air_coingecko', '2c968084846b641501846b6415d20000')
    mapRemoteTable.set('coingecko', '2c968084846b641501846b6415d20000')

    // dev only
    // https://rpa.w3bb.cc/rpa-server/online/cgform/head/list?column=createTime&order=desc&pageNo=1&pageSize=10&copyType=0&_t=1668874840187
    // tableName -> id
    // tableTxt -> id
}

const init = (config) => {
    // token
    initMapTable();
}

const  getListData = async (listKey, pageNo, pageSize) => {  
    //  https://rpa.w3bb.cc/rpa-server/online/cgform/api/getData/[tableId]

        if(!listKey in mapRemoteTable){
            return
        }
        let tableId = mapRemoteTable.get(listKey)
        let result
        await axios.request({
            method: 'get',
            url: 'https://rpa.w3bb.cc/rpa-server/online/cgform/api/getData/2c968084846b641501846b6415d20000?hasQuery=true&column=id&order=asc&pageNo=1&pageSize=10'
        }).then(function (response){
            console.debug(response)
            if(response.status === 200 && response.data.success){
                console.debug(response.data.result)
                result = response.data.result
            }else{
                result = response
            }    
        }).catch(function (error){
            console.log(error)
        }).finally(function (){
        })
        return result
}

const getCoingeckoListData = (pageNo, pageSize) => {
    return getListData('coingecko', pageNo, pageSize)
}

const getRpaPlanList = () => {
    return getListData('RPA计划', pageNo, pageSize)
}


exports = module.exports = {
    dataServiceInit : init,
    getListData : getListData,
    getCoingeckoListData : getCoingeckoListData
  }