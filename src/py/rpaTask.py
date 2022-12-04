# -*-coding:utf-8 -*-
'''
python 处理rpaTask
流程脚本为playwright python时调用
'''
import sys
print('script:',sys.argv[0])
for i in range(1, len(sys.argv)):
    print('param:',i, sys.argv[i])
