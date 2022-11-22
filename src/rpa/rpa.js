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

const { browserInit, openBrowser, frontBrowser, closeBrowser} = require('./browser')
const { dataUtilInit, getListData, getRpaPlanTaskList, getDetailData} = require('./dataUtil')


const rpaConfig = {}

const startRpa = () => {
    console.debug('start rpa ...')
    console.debug(rpaConfig)

    browserInit(rpaConfig)

    dataUtilInit(rpaConfig)

    loadLocalApi()

    checkPlanTask()
}

const checkPlanTask = () => {
  schedule.scheduleJob('0 */1 * * * *', async ()=>{
    console.log('checkPlanTask:' + new Date());
    // TODO 过滤，只获取已配置到当前节点或者归属当前用户的未分配节点任务
    let result = await getRpaPlanTaskList()
    if(result && result.records){
      // for tasks
      for(i in result.records){
         // 调用 任务处理
        execRpaTask(result.records[i])
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
  // 2 获取任务的执行脚本
  let scriptResult = await getDetailData('rpa_flow_script', taskConfig['scriptid']);
  console.debug(scriptResult)

  // 3 根据任务所属项目获取项目账号信息(包含浏览器及代理信息)
  let queryParams = {}
  queryParams['projectid'] = taskConfig['projectid']
  let result = await getListData('w3_project_account',queryParams)
  //console.debug(result)
  // 4 每个账号独立运行（结果更新到项目明细记录中）
  if(result && result.records){
    // for 账号明细
    for(i in result.records){
       // 账号处理
       let item = result.records[i]     
       // 'w3_browser' - browserid
       let browser = await getDetailData('w3_browser', item['browserid'])
       if(browser){
        item['browser'] = browser
       }
       console.debug(item)
    }
  }
  // 5 更新任务状态，解锁任务
}

exports = module.exports = {
    rpaConfig: rpaConfig,
    startRpaServer: startRpa
};