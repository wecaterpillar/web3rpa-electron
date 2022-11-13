

## 重要交互操作

- ipcMain message
  - restartNode
  - stopNode
  
## 数据目录
  - 应用数据根目录，例 /Users/xxx/Library/Application Support/Web3RPA
    - config.json 环境配置
    - lib
      - browser 浏览器文件
      - plugin 插件文件
      - 其他系统公用
    - user 用户文件
      - conf sqlite 浏览器配置
      - rpa sqlite  RPA流程配置
      - cache 各个浏览器缓存
      - data 用户数据
    - update 在线更新
      - bundle + main + rpa
      - version 版本下载
    - logs 日志
    - 其他文件


## 定制菜单？
- File
  - logs  emit: open-soft-folder
  - cache emit: open-catch-folder
- Window
  - refresh
- Help
  - Check For updates emit: check-update
  - changeLine emit: switch-line, 'http://xxx'
  - emit: open-proxy-window
  - emit: open-about-website
  - emit: open-help-website


## api


- 获取IP信息 
参考  https://api-global.adspower.net/sys/config/ip/get-visitor-ip