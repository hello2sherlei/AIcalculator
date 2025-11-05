#!/bin/bash

# AI Time Tracker 启动脚本
# 双击此文件即可启动应用

# 获取脚本所在目录
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# 进入项目目录
cd "$DIR"

echo "================================"
echo "  AI Time Tracker 启动中..."
echo "================================"
echo ""

# 检查 node_modules 是否存在
if [ ! -d "node_modules" ]; then
    echo "⚠️  首次运行，正在安装依赖..."
    npm install
    echo ""
fi

# 启动应用
echo "✓ 正在启动应用..."
npm start

# 按任意键关闭窗口
echo ""
echo "按任意键关闭此窗口..."
read -n 1
