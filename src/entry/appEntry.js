const { app} = require('electron')
// os: mac vs linux vs win
const isMac = process.platform === 'darwin'
const isLinux = process.platform === 'linux'


// app path
const fs = require("fs");
const path = require('path');
let appExecPath = app.getAppPath();
let appDataPath = appExecPath;

const appName = 'web3rpa'

if(app.isPackaged){
    appExecPath = path.dirname(app.getPath('exe'));
    appDataPath = path.join(app.getPath('userData'), 'web3rpa');

    // check main
    // copy resource to dist
    //require('../main/main')

    // check new version
    // check other lib(chrome/extensions/..)

  }else{
    require('../../src/main/main')
    // for dev
    console.debug('isPackaged appExecPath='+path.dirname(app.getPath('exe')));
    console.debug('isPackaged appDataPath='+path.dirname(path.join(app.getPath('userData'), appName)));
    console.debug('isPackaged appModulePath='+path.dirname(app.getPath('module')));
    console.debug('isPackaged appLogsPath='+path.dirname(app.getPath('logs')));
  
    // debug
    //console.debug('dir temp='+path.dirname(app.getPath('temp')));
    //console.debug('dir appData='+path.dirname(app.getPath('appData')));
    //console.debug('dir userData='+path.dirname(app.getPath('userData')));
  }
  console.log('appExecPath='+appExecPath);
  console.log('appDataPath='+appDataPath);