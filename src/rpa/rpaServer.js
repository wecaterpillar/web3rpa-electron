const log = require('electron-log')
const schedule = require('node-schedule')

// 线程池
const Piscina = require('piscina')
// 线程池初始化先按默认值，后期考虑根据机器情况做优化
const piscina = new Piscina()

const dataUtil = require('./dataUtil')

const os = require('os')
const fs = require('fs')
const path = require('path')

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function getDateTime() {
  const d_t = new Date()
  return d_t.getFullYear() + "-" + ("0"+(d_t.getMonth()+1)).slice(-2)+ "-" + ("0"+d_t.getDate()).slice(-2) 
   + " " + ("0"+d_t.getHours()).slice(-2) + ":" + d_t.getMinutes() + ":" + d_t.getSeconds()
}

const encryptMd5 = (str) => {
  let CryptoJS = require("crypto-js")
  return CryptoJS.MD5(str).toString()
}

/////////////////////////////////

const rpaConfig = {}

const startRpa = () => {
    log.debug('start rpa ...')
    log.debug(rpaConfig)

    // 1. load rpa config

    if(!rpaConfig.appCurrentUser){
      rpaConfig.appCurrentUser = {}
    }

    rpaConfig.getUsername = getUsername

    // 2. init
    // 2.1 remote server
    let remoteServer = require('../help/remoteServer')
    remoteServer.remoteServerInit(rpaConfig)
    
    // 2.2 local api
    // localAPI server
    // set port??
    let localApi = require("./localApi")

    // 2.3 dataUtil
    rpaConfig['localApi'] = false
    dataUtil.dataUtilInit(rpaConfig)

    // 2.4 browser
    const browserUtil = require('./browserUtil')
    browserUtil.browserInit(rpaConfig)


    // 3 rpa 
    // 3.1 node status
    sleep(10000)
    // 先调用心跳检查更新token
    updateNodeStatus()

    // 3.2 check task
    sleep(10000)
    checkPlanTask()

    if(!rpaConfig.isPackaged){
      
    }
}

const restartRpa = () =>{
  log.debug('restart rpa ...')
  console.debug(rpaConfig)
}

const callbackGetAppCurrentUser = async () => {
  let userInfo = await rpaConfig.callbackGetAppCurrentUser()
  if('username' in userInfo && !!userInfo['username']){
    rpaConfig.appCurrentUser = userInfo
    // save to local file, for dev only
    //const appCurrentUserPath = path.join(rpaConfig.appDataPath, 'appLoginUser')
    //fs.writeFileSync(appCurrentUserPath, JSON.stringify(rpaConfig.appCurrentUser))
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

const updateNodeStatus = () => {
  schedule.scheduleJob('10 */1 * * * *', async ()=>{
    console.debug('updateNodeStatus:' + new Date());
    let nodeData
    // 1. get nodeName from config
    let nodeName
    // 1.1 load from appConfig (开发环境初次可手动设置)
    if('nodeName' in rpaConfig.appConfig){
      nodeName = rpaConfig.appConfig['nodeName']
    }
    // 1.2 load from file
    let nodeName2
    const nodeNamePath = path.join(rpaConfig.appDataPath, 'nodeName')
    if(fs.existsSync(nodeNamePath)){
      nodeName2 = fs.readFileSync(nodeNamePath).toString()
    }
    if(!!nodeName){
      if(!nodeName2 || nodeName !== nodeName2){
        fs.writeFileSync(nodeNamePath, nodeName)
      }
    }else{
      if(!!nodeName2){
        nodeName = nodeName2
        rpaConfig.appConfig['nodeName'] = nodeName
      }
    }
    let username 
    if(!!!nodeName){
      // create new name
      // nodeName = userInfo['hostname']
      let hostname = os.hostname()
      username = await getUsername()
      if(!!username){
        if(!!hostname){
          nodeName = hostname.toLowerCase().slice(0,8)+'-'+username.toLowerCase().slice(0,4)
        }else{
          const {
            randomBytes
          } = await import('crypto');      
          const buf = randomBytes(3);
          nodeName = username.toLowerCase().slice(0,4)+buf.toString('hex')
        }
        
        console.log(nodeName)
      }
      if(!!nodeName){
        rpaConfig.appConfig['nodeName'] = nodeName
        fs.writeFileSync(nodeNamePath, nodeName)
      }  
    }

    // 2. query nodeData, if no exist then create 
    if(!!nodeName){
        // 2. query node  查询优先级？ node_name, username,update_by, create_by
        let nodeResult = await dataUtil.getListData('rpa_runnode',{'node_name':nodeName})
        //console.debug(nodeResult)    
        if(!!nodeResult){
          if(nodeResult.records.length>0){
            nodeData = nodeResult.records[0]
          }else{
            //init nodeData
            nodeData = {}
            nodeData['node_name'] = nodeName
            if(!username){
              username = await getUsername()
            }          
            if(!!username){
              nodeData['username'] = username  
              console.info(nodeData)
              await createDetailData('rpa_runnode', nodeData)
            }       
          }
        }      
    }

    // 3. update node status 
    if(!!nodeData && 'id' in nodeData){
       // todo add  ip
      nodeData['status'] = 'running'
      nodeData['update_time'] = getDateTime()
      await dataUtil.updateDetailData('rpa_runnode', nodeData)
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
    log.debug('checkPlanTask:' + new Date());
    // TODO 过滤，只获取已配置到当前节点或者归属当前用户的未分配节点任务
    let result = await dataUtil.getRpaPlanTaskList({runnode: nodeName, status: 'todo'})
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


// RPA 计划
// 1 计划生成任务在服务器处理
// 2 检查本地分配任务或者远程分配任务，并维护状态
// child_process
// 3 执行任务脚本-获取脚本，获取账号，执行任务，更新结果

const execRpaTask = async (taskConfig) => {
  log.debug("execRpaTask:" + JSON.stringify(taskConfig))
  // 1 锁定当前任务，防止重复执行
  taskConfig['status'] = 'doing'
  taskConfig['start_time'] = getDateTime()
  await dataUtil.updateDetailData('rpa_plan_task', taskConfig)


  // 2 获取通用任务
  // 2.1 项目信息
  let projectId = taskConfig['project_id']
  let projectResult = await dataUtil.getDetailData('w3_project_auto', projectId);

  var projectFilePath = path.join(rpaConfig.appDataPath, '/flowscript/'+projectResult['code'])
  if(!fs.existsSync(projectFilePath)){
    fs.mkdirSync(projectFilePath)
  }

  // 2.2 执行脚本
  let scriptResult = await dataUtil.getDetailData('rpa_flow_script', taskConfig['script_id']);
  if(!scriptResult || !'script' in scriptResult){
    log.error('can not get script:' + taskConfig['script_id'])
    return
  }
  let scriptContext = scriptResult['script']
  //console.debug(scriptResult)
  let fileName = scriptResult['name'].slice(0,5)+'-'+encryptMd5(scriptContext).slice(-5)+'.js'
  var scriptFilePath =  path.join(projectFilePath, '/'+fileName);
  if(!fs.existsSync(scriptFilePath)){
    // todo 可能会替换脚本中开发和生产环境不同的路径
    if(rpaConfig.isPackaged){
      // must copy dist from packaged resource to w3rpa directrion
      // ../../dev/rpa/ => ../../dist/rpa/
      scriptContext = scriptContext.replaceAll('../../dev/rpa/','../../dist/rpa/')
      // ../../src/rpa/ => ../../dist/rpa/
      scriptContext = scriptContext.replaceAll('../../src/rpa/','../../dist/rpa/')
    }else{
      // 注意下载后代码在w3rpa/flowscript目录下, 同dev和src代码不在同一级目录
      // ../../dev/rpa/ => ../../../src/rpa/
      scriptContext = scriptContext.replaceAll('../../dev/rpa/','../../../src/rpa/')
      scriptContext = scriptContext.replaceAll('../../src/rpa/','../../../src/rpa/')
    }
    fs.writeFileSync(scriptFilePath, scriptContext)
  }
  

  // 3 根据任务所属项目获取项目账号信息(包含浏览器及代理信息)
  let queryParams = {}
  queryParams['project_id'] = projectId
  // 是否还有其他筛选条件？ 如何防止重复执行？
  // 根据任务配置中确定的最大数量查询
  let result = await dataUtil.getListData('w3_project_account',queryParams)

  //console.debug(result)
  // 4 每个账号独立运行（结果更新到项目明细记录中）
  // 需要增加分页机制
  if(result && result.records){
    // for 账号明细
    for(i in result.records){
       // 账号处理
       let item = result.records[i]
       // project
       item['project'] = projectResult['code']
       item['project_code'] = projectResult['code']
       // task
       item['task_id'] = taskConfig['id']
       // 'w3_browser' - browserid
       let browser = await dataUtil.getBrowserInfo({browserId:item['browser_id']})
       if(browser){
        browser['browserKey'] = browser['name']
        item['browser'] = browser
       }
       //console.debug(item)    
       // try exec project custmized script
       //let browserConfig = await getBrowserConfig(item['browser'])
       //let browserContext = await getBrowserContext(browserConfig)
       invokeFlowScript({item, scriptFilePath})
    }
  }
  // 5 更新任务状态，解锁任务
  // 异步需要额外方式检查是否已经完成任务
  //taskConfig['status'] = 'done'
  //taskConfig['end_time'] = getDateTime()
  //taskConfig['end_time'] = new Date()
  //await updateDetailData('rpa_plan_task', taskConfig)
}

const invokeFlowScript = ({item, scriptFilePath}) =>{

  piscina.run({item:item, rpaConfig:getSimpleRpaConfig()},{filename: scriptFilePath, name: 'flow_start'} )
  
  // test dynamic load script file
  //  const {flow_start} = require(scriptFilePath) 
  //  log.debug({item})
  //  flow_start({item})
}

const getSimpleRpaConfig = () => {
  // 复制必要的rpaConfig 配置信息
  let rpaConfigJson = {}
  rpaConfigJson.isMac = rpaConfig.isMac
  rpaConfigJson.isLinux = rpaConfig.isLinux
  // 数据目录
  rpaConfigJson.appDataPath = rpaConfig.appDataPath 
  // local api
  return rpaConfigJson
}

exports = module.exports = {}

exports.rpaConfig = rpaConfig
exports.startRpa = startRpa