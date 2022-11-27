const playwright = require('playwright')
console.debug("rpa load playwright")
const schedule = require('node-schedule')
var CryptoJS = require("crypto-js");

const { remoteServerInit } = require('./remoteServer')
const { browserInit } = require('./browser')
const { dataUtilInit, getListData, getDetailData, updateDetailData, createDetailData, getRpaPlanTaskList} = require('./dataUtil')

const fs = require('fs')
const path = require('path');
const { randomBytes } = require('crypto')

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function getDateTime() {
  const d_t = new Date()
  return d_t.getFullYear() + "-" + ("0"+(d_t.getMonth()+1)).slice(-2)+ "-" + ("0"+d_t.getDate()).slice(-2) 
   + " " + ("0"+d_t.getHours()).slice(-2) + ":" + d_t.getMinutes() + ":" + d_t.getSeconds()
}

const rpaConfig = {}

const startRpa = () => {
    console.debug('start rpa ...')
    console.debug(rpaConfig)

    // 1. load rpa config

    if(!rpaConfig.appCurrentUser){
      rpaConfig.appCurrentUser = {}
    }

    rpaConfig.getUsername = getUsername
    rpaConfig.getLoginToken = getLoginToken
    rpaConfig.resetLoginToken = resetLoginToken

    // 2. init
    // 2.1 remote server
    remoteServerInit(rpaConfig)
    
    // 2.2 local api
    loadLocalApi(rpaConfig)

    // 2.3 dataUtil
    dataUtilInit(rpaConfig)

    // 2.4 browser
    browserInit(rpaConfig)    


    // 3 rpa 
    // 3.1 check task
    sleep(10000)
    checkPlanTask()
    // 3.2 node status
    sleep(10000)
    updateNodeStatus()
}

const callbackGetAppCurrentUser = async () => {
  let userInfo = await rpaConfig.callbackGetAppCurrentUser()
  if('username' in userInfo && !!userInfo['username']){
    rpaConfig.appCurrentUser = userInfo
    // save to local file, for dev only
    const appCurrentUserPath = path.join(rpaConfig.appDataPath, 'appLoginUser')
    fs.writeFileSync(appCurrentUserPath, JSON.stringify(rpaConfig.appCurrentUser))
  }
}

const getUsername = async () => {
  let username 
  if(rpaConfig.appCurrentUser && 'username' in rpaConfig.appCurrentUser){
    username = rpaConfig.appCurrentUser['username'] 
  }
  if(!username){
    await callbackGetAppCurrentUser()
    if(rpaConfig.appCurrentUser && 'username' in rpaConfig.appCurrentUser){
      username = rpaConfig.appCurrentUser['username'] 
    }
  }
  return username
}

const getLoginToken = async () => {
  let token = await rpaConfig.appCurrentUser['token'] 
  if(!token){
    await callbackGetAppCurrentUser()
    token = await rpaConfig.appCurrentUser['token']
  }
  return token
} 

const resetLoginToken = async () => {
  rpaConfig.appCurrentUser['token'] = undefined
}

var runNodeId
const updateNodeStatus = () => {
  schedule.scheduleJob('0 */2 * * * *', async ()=>{
    console.log('updateNodeStatus:' + new Date());
    let nodeData
    // 1. get nodeName from config
    let nodeName
    // 1.1 load from appConfig (开发环境初次可手动设置)
    if('nodeName' in rpaConfig.appConfig){
      nodeName = rpaConfig.appConfig['nodeName']
    }
    // 1.2 load from file
    let nodename2
    const nodeNamePath = path.join(rpaConfig.appDataPath, 'nodeName')
    if(fs.existsSync(nodeNamePath)){
      nodeName2 = fs.readFileSync(nodeNamePath).toString()
    }
    if(!!nodeName){
      if(!nodeName2 || nodeName !== nodename2){
        fs.writeFileSync(nodeNamePath, nodeName)
      }
    }else{
      if(!!nodeName2){
        nodeName = nodeName2
        rpaConfig.appConfig['nodeName'] = nodeName
      }
    }
    // 2. query nodeData
    if(!!nodeName){
        // 2. query node  查询优先级？ node_name, username,update_by, create_by
        let nodeResult = await getListData('rpa_runnode',{'node_name':nodeName})
        //console.debug(nodeResult)    
        if(!!nodeResult && nodeResult.records.length>0){
          nodeData = nodeResult.records[0]
        }
    }

    // 3. init nodeData
    if(!!!nodeData){
      nodeData = {}
      if(!!!nodeName){
        nodeName = userInfo['hostname']
        if(!!!nodeName){
          const {
            randomBytes
          } = await import('crypto');      
          const buf = randomBytes(5);
          nodeName = buf.toString('hex')
        }   
        console.log(nodeName)
        if(!!nodeName){
          nodeData['node_name'] = nodeName
          rpaConfig.appConfig['nodeName'] = nodeName
          fs.writeFileSync(nodeNamePath, nodeName)
        }  
      }
      nodeData['node_name'] = nodeName
      let username = getUsername()
      if(!!username){
        nodeData['username'] = username  
        console.info(nodeData)
        await createDetailData('rpa_runnode', nodeData)
      }       
    }
   
    if(!!nodeData && 'id' in nodeData){
       // todo add  ip
      nodeData['status'] = 'running'
      nodeData['update_time'] = getDateTime()
      await updateDetailData('rpa_runnode', nodeData)
    }
  })
}

const checkPlanTask = () => {
  // TODO 指定节点或者指定当前用户但无指定节点
  // 当前只查询分配给本节点的任务，且为待处理
  // username, runnode
  let username = getUsername()
  let nodeName = rpaConfig.appConfig['nodeName']
  if(!nodeName){
    const nodeNamePath = path.join(rpaConfig.appDataPath, 'nodeName');
    if(fs.existsSync(nodeNamePath)){
      nodeName = fs.readFileSync(nodeNamePath).toString();
    }
  }
  schedule.scheduleJob('0 */2 * * * *', async ()=>{
    console.log('checkPlanTask:' + new Date());
    // TODO 过滤，只获取已配置到当前节点或者归属当前用户的未分配节点任务
    let result = await getRpaPlanTaskList({runnode: nodeName, status: 'todo'})
    if(result && result.records){
      // for tasks
      for(i in result.records){
         // 调用 任务处理
        execRpaTask(result.records[i])
        // sleep
        sleep(30000)
      }
     
    }
    //console.debug(result)
}); 
}


// localAPI server
var localApi
const loadLocalApi = () => {
  localApi = require("./localApi")
}


// RPA 计划
// 1 计划生成任务在服务器处理
// 2 检查本地分配任务或者远程分配任务，并维护状态
// child_process
// 3 执行任务脚本-获取脚本，获取账号，执行任务，更新结果

const execRpaTask = async (taskConfig) => {
  console.debug("execRpaTask")
  console.debug(taskConfig)
  // 1 锁定当前任务，防止重复执行
  taskConfig['status'] = 'doing'
  taskConfig['start_time'] = getDateTime()
  await updateDetailData('rpa_plan_task', taskConfig)


  // 2 获取通用任务
  // 2.1 项目信息
  let projectId = taskConfig['project_id']
  let projectResult = await getDetailData('w3_project_auto', projectId);

  var projectFilePath = path.join(rpaConfig.appDataPath, '/flowscript/'+projectResult['code'])
  if(!fs.existsSync(projectFilePath)){
    fs.mkdirSync(projectFilePath)
  }

  // 2.2 执行脚本
  let scriptResult = await getDetailData('rpa_flow_script', taskConfig['script_id']);
  if(!scriptResult || !'script' in scriptResult){
    console.error('can not get script')
    return
  }
  let scriptContext = scriptResult['script']
  //console.debug(scriptResult)
  let fileName = scriptResult['name'].slice(0,5)+'-'+CryptoJS.MD5(scriptContext).toString().slice(-5)+'.js'
  var scriptFilePath =  path.join(projectFilePath, '/'+fileName);
  if(!fs.existsSync(scriptFilePath)){
    // todo 可能会替换脚本中开发和生产环境不同的路径
    if(rpaConfig.isPackaged){
      // ../../dev/rpa/ => ../../lib/rpa/
      // ../../src/rpa/ => ../../lib/rpa/
    }else{
      // ../../dev/rpa/ => ../../src/rpa/
      scriptContext = scriptContext.replaceAll('../../dev/rpa/','../../src/rpa/')
      // ../../lib/rpa/ => ../../src/rpa/
      scriptContext = scriptContext.replaceAll('../../lib/rpa/','../../src/rpa/')
    }
    fs.writeFileSync(scriptFilePath, scriptContext)
  }
  

  // 3 根据任务所属项目获取项目账号信息(包含浏览器及代理信息)
  let queryParams = {}
  queryParams['project_id'] = projectId
  // 是否还有其他筛选条件？
  let result = await getListData('w3_project_account',queryParams)

  //console.debug(result)
  // 4 每个账号独立运行（结果更新到项目明细记录中）
  if(result && result.records){
    // for 账号明细
    for(i in result.records){
       // 账号处理
       let item = result.records[i]     
       // 'w3_browser' - browserid
       let browser = await getBrowserInfo({browserId:item['browser_id']})
       if(browser){
        browser['browserKey'] = browser['name']
        item['browser'] = browser
       }
       //console.debug(item)    
       // try exec project custmized script
       //let browserConfig = await getBrowserConfig(item['browser'])
       //let browserContext = await getBrowserContext(browserConfig)

       // test dynamic load script file
       const {flow_start} = require(scriptFilePath) 
       flow_start({item})
    }
  }
  // 5 更新任务状态，解锁任务
  // 异步需要额外方式检查是否已经完成任务
  //taskConfig['status'] = 'done'
  //taskConfig['end_time'] = getDateTime()
  //taskConfig['end_time'] = new Date()
  //await updateDetailData('rpa_plan_task', taskConfig)
}

exports = module.exports = {
    rpaConfig: rpaConfig,
    startRpaServer: startRpa
};