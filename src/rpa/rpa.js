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
const schedule = require('node-schedule')
var CryptoJS = require("crypto-js");

const { browserInit, getBrowserConfig, getBrowserContext, openBrowser, frontBrowser, closeBrowser} = require('./browser')
const { dataUtilInit, getListData, getRpaPlanTaskList, getDetailData, updateDetailData} = require('./dataUtil')

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

    browserInit(rpaConfig)

    dataUtilInit(rpaConfig)

    loadLocalApi()

    sleep(10000)
    checkPlanTask()
    sleep(10000)
    updateNodeStatus()
}

var runNodeId
const updateNodeStatus = () => {
  schedule.scheduleJob('0 */10 * * * *', async ()=>{
    console.log('updateNodeStatus:' + new Date());
    let nodeData
    // 1. get nodeName from config
    let nodeName
    // 1.1 load from file
    const nodeNamePath = path.join(rpaConfig.appDataPath, 'nodeName');
    if(fs.existsSync(nodeNamePath)){
      nodeName = fs.readFileSync(nodeNamePath).toString();
    }
    // 1.2 load from appConfig (开发环境初次可手动设置)
    if(!nodeName && 'nodeName' in rpaConfig.appConfig){
      nodeName = rpaConfig.appConfig['nodeName']
      if(!!nodeName){
        fs.writeFileSync(nodeNamePath, nodeName)
      } 
    }
    // 2. query nodeData
    if(!!nodeName){
           // 2. query node
        let nodeResult = await getListData('rpa_runnode',{'node_name':nodeName})
        //console.debug(nodeResult)
        
        if(nodeResult && nodeResult.records){
          nodeData = nodeResult.records[0]
        }
    }

    // 3. init nodeData
    if(!!!nodeData){
      nodeData = {}
      let userInfo = await rpaConfig.callbackGetAppCurrentUser()
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
      let username = userInfo['username'] 
      if(!!username){
        nodeData['username'] = username  
        const uuidv1 = ruquire('uuid/v1')
        nodeData['id'] = uuidv1().replace(/-/g, '') 
      }   
      console.info(nodeData)
    }
   
    if(!!nodeData && 'id' in nodeData){
      // todo add user, ip
      nodeData['update_time'] = getDateTime()
      await updateDetailData('rpa_runnode', nodeData)
    }
  })
}

const checkPlanTask = () => {
  schedule.scheduleJob('0 */30 * * * *', async ()=>{
    console.log('checkPlanTask:' + new Date());
    // TODO 过滤，只获取已配置到当前节点或者归属当前用户的未分配节点任务
    let result = await getRpaPlanTaskList()
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
  taskConfig['result'] = 'doing'
  taskConfig['start_time'] = getDateTime()
  //taskConfig['start_time'] = new Date()
  // Data truncation: Incorrect datetime value: '2022-11-22T10:15:00.795Z' for column 'start_time'
  await updateDetailData('rpa_plan_task', taskConfig)
  // 2 获取任务的执行脚本
  let scriptResult = await getDetailData('rpa_flow_script', taskConfig['script_id']);
  if(!scriptResult || !'script' in scriptResult){
    console.error('can not get script')
    return
  }
  let scriptContext = scriptResult['script']
  //console.debug(scriptResult)
  var scriptFileName = path.join(rpaConfig.appDataPath, '/flowscript/'+scriptResult['name'].slice(0,5)+'-'+CryptoJS.MD5(scriptContext).toString().slice(-5)+'.js')
  if(!fs.existsSync(scriptFileName)){
    fs.writeFileSync(scriptFileName, scriptContext)
  }
  

  // 3 根据任务所属项目获取项目账号信息(包含浏览器及代理信息)
  let queryParams = {}
  queryParams['project_id'] = taskConfig['project_id']
  let result = await getListData('w3_project_account',queryParams)

  //console.debug(result)
  // 4 每个账号独立运行（结果更新到项目明细记录中）
  if(result && result.records){
    // for 账号明细
    for(i in result.records){
       // 账号处理
       let item = result.records[i]     
       // 'w3_browser' - browserid
       let browser = await getDetailData('w3_browser', item['browser_id'])
       if(browser){
        browser['browserKey'] = browser['name']
        item['browser'] = browser
       }
       //console.debug(item)    
       // try exec project custmized script
       //let browserConfig = await getBrowserConfig(item['browser'])
       //let browserContext = await getBrowserContext(browserConfig)

       // test dynamic load script file
       const {flow_start} = require(scriptFileName) 
       flow_start({item})
    }
  }
  // 5 更新任务状态，解锁任务
  taskConfig['result'] = 'complete'
  taskConfig['end_time'] = getDateTime()
  //taskConfig['end_time'] = new Date()
  await updateDetailData('rpa_plan_task', taskConfig)
}

exports = module.exports = {
    rpaConfig: rpaConfig,
    startRpaServer: startRpa
};