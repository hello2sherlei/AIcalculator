# 桌面快捷方式创建指南

## macOS 桌面快捷方式

### 方法1: 打包后创建别名（推荐）

如果你已经打包了应用：

1. 打包应用：
   ```bash
   npm run build:mac
   ```

2. 打包完成后，在 `dist` 目录找到 `AI Time Tracker.app`

3. 创建桌面别名：
   - **选项A - 使用拖拽**：
     - 按住 `⌘ Command` + `⌥ Option` 键
     - 将 `AI Time Tracker.app` 拖到桌面
     - 这会创建一个别名（快捷方式）

   - **选项B - 使用右键菜单**：
     - 右键点击 `AI Time Tracker.app`
     - 选择 "制作替身"
     - 将创建的替身移动到桌面

   - **选项C - 使用终端命令**：
     ```bash
     # 假设应用在 /Applications/AI Time Tracker.app
     ln -s "/Applications/AI Time Tracker.app" ~/Desktop/"AI Time Tracker"
     ```

### 方法2: 开发模式启动脚本

如果你在开发模式下运行，可以创建一个启动脚本：

1. 在项目根目录创建启动脚本（已提供 `launch-app.command`）

2. 设置可执行权限：
   ```bash
   chmod +x launch-app.command
   ```

3. 双击 `launch-app.command` 即可启动应用

4. （可选）将 `launch-app.command` 复制到桌面作为快捷方式

### 方法3: 添加到 Dock（推荐用于常用应用）

1. 启动应用
2. 应用图标会出现在菜单栏
3. 如果希望在 Dock 中保留：
   - 修改 `main.js` 中的 `skipTaskbar: false`
   - 右键点击 Dock 中的图标
   - 选择 "选项" → "在 Dock 中保留"

## Windows 桌面快捷方式

### 打包后创建快捷方式

1. 打包应用：
   ```bash
   npm run build:win
   ```

2. 在 `dist` 目录找到 `AI Time Tracker.exe`

3. 创建快捷方式：
   - 右键点击 `AI Time Tracker.exe`
   - 选择 "创建快捷方式"
   - 将快捷方式移动到桌面

### 开发模式

创建一个 `.bat` 文件：

```batch
@echo off
cd "C:\path\to\AIcalculator"
npm start
```

## 开机自启动

应用内置了开机自启动选项：

1. 启动应用
2. 点击设置按钮（⚙️）
3. 勾选 "开机自动启动"
4. 保存设置

这样应用会在系统启动时自动运行并常驻菜单栏/托盘。

## 注意事项

- **macOS**: 菜单栏图标会常驻显示，点击图标即可显示/隐藏主窗口
- **Windows**: 托盘图标会常驻显示，点击图标即可显示/隐藏主窗口
- 关闭主窗口不会退出应用，只会隐藏到菜单栏/托盘
- 要完全退出应用，请右键点击菜单栏/托盘图标，选择"退出"
