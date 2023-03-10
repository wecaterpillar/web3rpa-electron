const log = require('electron-log').create('rpa')
Object.assign(console, log.functions)
log.transports.file.resolvePath = () => path.join(rpaConfig.appDataPath, 'logs' ,'rpa.log')
//log.initialize({ preload: true })

const schedule = require('node-schedule')
// 线程池
const Piscina = require('piscina')
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
exports = module.exports = {}



const rpaConfig = {}

exports.rpaConfig = rpaConfig


const startRpa = () => {
    log.debug('start rpa ...')
    log.debug(JSON.stringify(rpaConfig, null, 2))

    // 1. load rpa config

    if(!rpaConfig.appCurrentUser){
      rpaConfig.appCurrentUser = {}
    }

    if(!rpaConfig.getUsername){
      rpaConfig.getUsername = getUsername
    }
    
    // 2. init
    let remoteServer
    // 2.1 remote server
    try{
      if(!remoteServer){
        remoteServer = require('../help/remoteServer')
        remoteServer.remoteServerInit(rpaConfig)
        exports.resetToken = remoteServer.resetToken
      }     
    }catch(err){
      log.warn(err)
    }
 
    
    // 2.2 local api
    // localAPI server
    // set port??  暂不实现换端口机制
    let localApi 
    if(!localApi){
      localApi = require("./localApi")
    }
    

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

    // 3.2 check download list
    // 先调用一次后再启动定时任务
    // 下载方法已过滤重复URL下载
    checkBrowserComponentJobFunc()
    checkBrowserComponent()

    // 3.3 check task
    sleep(10000)
    checkPlanTask()

}

exports.startRpa = startRpa

let checkBrowserComponentJob
const checkBrowserComponent = async () => {
  let interalMin = rpaConfig.appConfig['rpaCheckBrowserComponentInteralMin']
  if(!interalMin || interalMin>60){
    interalMin = 20
  }
  if(!!checkBrowserComponentJob){
    await checkBrowserComponentJob.cancel()
  }
  checkBrowserComponentJob = schedule.scheduleJob(`10 */${interalMin} * * * *`, checkBrowserComponentJobFunc)
}
const checkBrowserComponentJobFunc = async () => {
  log.info("check browser component")
  let downloadList = []
  // 不支持下载URL有空格，请提前处理 %20f
  let result =await dataUtil.getListData('w3_browser_component',{})
  if(result && result.records){
    let helper = require('../help/helper')
    for(i in result.records){
      let item = result.records[i]
      let type = item['type']
      let name = item['name']
       // 根据操作系统筛选浏览器，注意需要命名规则
      if('browser' === type){
        if(rpaConfig.isMac){
          if(!name.endsWith('-mac')){
            continue
          }
        }else if(rpaConfig.isLinux){

        }else{
          if(!name.endsWith('-win')){
            continue
          }
        }
      }
      // 检查目标目录或文件是否已存在
      let dist = item['filepath']
      if(helper.checkExistDistFile({distFile:dist})){
        continue
      }
      // 检查是否存在目标文件或目录的zip？
      let downloadUrl = item['download_url']      
      downloadList.push({name, dist, downloadUrl})
    }
    // invoke download
    if(downloadList && downloadList.length>0){
      helper.addDownloads(downloadList)
    }
  } // end if
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

let updateNodeStatusJob
const updateNodeStatus = async () => {
  let interalMin = rpaConfig.appConfig['rpaUpdateNodeStatusInteralMin']
  if(!interalMin || interalMin>60){
    interalMin = 2
  }
  if(!!updateNodeStatusJob){
    await updateNodeStatusJob.cancel()
  }
  updateNodeStatusJob = schedule.scheduleJob(`10 */${interalMin} * * * *`, async ()=>{
    console.debug('updateNodeStatus:' + new Date());
    if(!rpaConfig.visitor){
      rpaConfig.visitor =  await dataUtil.getVisitorIp()
      log.debug(rpaConfig.visitor)
    }
    
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
              await dataUtil.createDetailData('rpa_runnode', nodeData)
            }       
          }
        }      
    }

    // 3. update node status 
    if(!!nodeData && 'id' in nodeData){
       // todo add  ip
      nodeData['status'] = 'running'
      if(rpaConfig.visitor && 'ip' in rpaConfig.visitor){
        nodeData['ip'] = rpaConfig.visitor['ip']
      }
      nodeData['update_time'] = getDateTime()
      await dataUtil.updateDetailData('rpa_runnode', nodeData)
    }
  })
}

let checkPlanTaskJob
const checkPlanTask = async () => {
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
  let interalMin = rpaConfig.appConfig['rpaCheckTaskInteralMin']
  if(!interalMin || interalMin>60){
    interalMin = 10
  }
  if(!!checkPlanTaskJob){
    try{
      await checkPlanTaskJob.cancel()
    }catch(err){
      log.warn(err)
    }
  }
  checkPlanTaskJob = schedule.scheduleJob('checkPlanTaskJob',`0 */${interalMin} * * * *`, async ()=>{
    log.debug('checkPlanTask:' + new Date());
    // TODO 过滤，只获取已配置到当前节点或者归属当前用户的未分配节点任务
    let result = await dataUtil.getRpaPlanTaskList({runnode: nodeName, status: 'todo'})
    if(result && result.records){
      // for tasks
      for(i in result.records){
         // 调用 任务处理
        await execRpaTask(result.records[i])
        // sleep
        sleep(30000)
      }
     
    }
    //console.debug(result)
    await testWorker()
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
  let visitor = rpaConfig.visitor
  if(!visitor){
    visitor = dataUtil.getVisitorIp()
    rpaConfig.visitor = visitor
  } 
  if(visitor && visitor['ip']){
    taskConfig['ip'] = visitor['ip']
  }
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

  // 2.2 执行脚本下载到本地
  let scriptFileExt = 'js'
  let scriptResult = await dataUtil.getDetailData('rpa_flow_script', taskConfig['script_id']);
  if(!scriptResult || !'script' in scriptResult){
    log.error('can not get script:' + taskConfig['script_id'])
    return
  }
  let scriptType = scriptResult['type']
  if('playwright-py' === scriptType || 'playwright-python' === scriptType){
    scriptFileExt = 'py'
  }
  let scriptContext = scriptResult['script']
  //console.debug(scriptResult)
  let fileName = scriptResult['name'].slice(0,5)+'-'+encryptMd5(scriptContext).slice(-5)+'.'+scriptFileExt
  var scriptFilePath =  path.join(projectFilePath, '/'+fileName);
  if(!fs.existsSync(scriptFilePath)){
    // 可能会替换脚本中开发和生产环境不同的路径
    // 统一开发和部署后目录到 [appDataPath]/dist
    // 目前为js替换规则，py可能规则不一样
    let destPath = '../../dist/rpa/'
    scriptContext = scriptContext.replaceAll('../../dev/rpa/',destPath)
    scriptContext = scriptContext.replaceAll('../../src/rpa/',destPath)
    if(rpaConfig.isPackaged){
      // must copy dist from packaged resource to w3rpa directrion
    }else{
      // 注意下载后代码在w3rpa/flowscript目录下, 同dev和src代码不在同一级目录
    }
    fs.writeFileSync(scriptFilePath, scriptContext)
  }
  taskConfig['scriptFilePath'] = scriptFilePath
  
  // TODO 根据scriptFileExt的类型选择进入 nodejs 或者 python 执行任务
  if('py' === scriptFileExt){
    // TODO 判断环境是否支持python，支持则调用python的任务处理程序
    try{      
      let rpaTaskPy = path.join(rpaConfig.appDataPath, 'dist/py/rpaTask.py')
      if(fs.existsSync(rpaTaskPy)){
        const spawn = require('child_process').spawn
        // TODO 参数准备
        const py = spawn('python3', [rpaTaskPy, JSON.stringify(taskConfig)])
        py.stdout.on('data', function(data){
          console.debug('stdout:'+data)
        })
        py.stderr.on('data', function(data){
          console.debug('stderr:'+data)
        })
        py.on('close', function(code){
          console.debug('python have exist, code='+code)
        })
      }     
    }catch(err){
      console.warn(err)
      log.warn(err)
      taskConfig['status'] = 'fail'
      taskConfig['end_time'] = getDateTime()
      taskConfig['last_msg'] = err
      await dataUtil.updateDetailData('rpa_plan_task', taskConfig)
    }
    return
  }

  // 3 根据任务所属项目获取项目账号信息(包含浏览器及代理信息)
  // 线程池初始化先按默认值，后期考虑根据机器情况做优化
  let threads = taskConfig['threads']
  if(!threads){
    threads = piscina.options.maxThreads
  }
  log.debug("task("+taskConfig['id']+") taskPiscina with maxThreads="+threads)
  let taskPiscina = new Piscina({
    maxThreads: threads
  })
  let queryParams = {}
  queryParams['project_id'] = projectId
  
  // 是否还有其他筛选条件？ 如何防止重复执行？
  // 根据任务配置中确定的最大数量查询
  let pageSize = 100
  let pageNo = 1
  while(true){
    queryParams['pageNo'] = pageNo
    queryParams['pageSize'] = pageSize
    // 需要增加查询条件，区分不同批次账号，方便多机器运行
    // superQueryMatchType=and
    // superQueryParams=
    // 规避数据库存放数组会导致界面编辑问题
    // [{"field":"filter","rule":"eq/like","val":"","type":"text","dbType":"string"}]
    // {"field":"filter","rule":"eq","val":"filter2","type":"text","dbType":"string"}  需要这个版本
    let detailFilter = taskConfig['detail_filter']
    if(!!detailFilter){
      // json 转换校验
      let jsonFilter = JSON.parse(detailFilter)
      queryParams['superQueryParams'] = encodeURI('['+JSON.stringify(jsonFilter)+']')
      queryParams['superQueryMatchType'] = 'and'   
    }
    let result = await dataUtil.getListData('w3_project_account',queryParams)

    //console.debug(result)
    // 4 每个账号独立运行（结果更新到项目明细记录中）
    // 需要增加分页机制
    if(result && result.records){
      // for 账号明细
      let i = 0;
      for (i = 0; i < result.records.length; i++) {
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
          item['browserKey'] = browser['name']
          browser['browserKey'] = browser['name']
          item['browser'] = browser
        }
        //console.debug(item)    
        // try exec project custmized script
        //let browserConfig = await getBrowserConfig(item['browser'])
        //let browserContext = await getBrowserContext(browserConfig)
        await invokeFlowScript({item, scriptFilePath, taskPiscina:taskPiscina})
        sleep(20000)
      }
      // 检查是否满页，不满则是最后一页
      if(i<pageSize-1){
        log.debug("task("+taskConfig['id']+") last page: "+pageNo)
        break
      }
    }else{
      log.debug("task("+taskConfig['id']+") last page or error, page="+pageNo)
      break
    }
    pageNo += 1
  } //end while
  
  // 5 更新任务状态，解锁任务
  // 异步需要额外方式检查是否已经完成任务
  // taskPiscina
  taskConfig['status'] = 'done'
  taskConfig['end_time'] = getDateTime()
  taskConfig['end_time'] = new Date()
  await dataUtil.updateDetailData('rpa_plan_task', taskConfig)
}

const invokeFlowScript = async ({item, scriptFilePath, taskPiscina}) =>{
  if(!taskPiscina){
    taskPiscina = piscina
  }
  // 运行环境子任务不能载入模块问题，需要引用父进程的软链接或者新建软链接到node_modules
  // --preserve-symlinks
  await taskPiscina.run({item: item, rpaConfig: getSimpleRpaConfig()},
    {filename: scriptFilePath, name: 'flow_start'})
  
  // test dynamic load script file
  //  const {flow_start} = require(scriptFilePath)
  //  log.debug({item})
  //  await flow_start({item,rpaConfig})
}

const testWorker = async () => {
  let tryTest = rpaConfig.appConfig['tryTest']
  if(!tryTest){
    return
  }
  let demoFile = 'flowscript/demo/script_demo.js'
  let scriptFilePath = path.join(rpaConfig.appDataPath, demoFile)
  console.debug(scriptFilePath)
  await piscina.run({item: {"browser":{"browserKey":"demo01"},"browserKey":"demo01"}, rpaConfig: getSimpleRpaConfig()},
  {filename: scriptFilePath, name: 'flow_start'})
}


const getSimpleRpaConfig = () => {
  // 复制必要的rpaConfig 配置信息
  let rpaConfigJson = {}
  rpaConfigJson.isMac = rpaConfig.isMac
  rpaConfigJson.isLinux = rpaConfig.isLinux
  // 数据目录
  rpaConfigJson.appDataPath = rpaConfig.appDataPath 
  // local api
  rpaConfigJson.isLocalDev = true
  rpaConfigJson.localApi = 'http://localhost:3500'
  return rpaConfigJson
}

