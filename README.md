# AI Time Tracker (AITT) 📊

一个简约、科技风的桌面时间管理工具，专为订阅多项AI服务的用户设计。

## ✨ 核心特性

- 🎯 **独立计时管理** - 为每个AI工具提供独立的倒计时功能
- 📊 **实时进度显示** - 科技风进度条实时展示使用情况
- 🎉 **回本激励** - 达到每日目标时长时的庆祝提示
- 📈 **统计功能** - 每日和每周累计使用时长统计
- ⚙️ **灵活配置** - 自定义工具名称、目标时长、透明度等
- 🌓 **始终置顶** - 窗口保持在最前方，方便随时查看
- 💾 **自动保存** - 每秒自动保存数据，防止数据丢失
- 🚀 **开机启动** - 可选的系统启动时自动运行

## 📋 默认配置

应用预设了四个常用AI工具：

1. **Chatgpt Plus**
2. **Claude Pro**
3. **Gemini Pro**
4. **即梦AI**

每个工具默认每日目标时长为 **2小时**（可自定义）。

## 🚀 快速开始

### 前置要求

- Node.js 16+
- npm 或 yarn

### 安装依赖

```bash
npm install
```

> **注意**: 如果在安装Electron时遇到网络问题，可以尝试：
> ```bash
> # 使用淘宝镜像
> npm config set electron_mirror https://npmmirror.com/mirrors/electron/
> npm install
> ```

### 运行应用

```bash
npm start
```

### 打包应用

Windows:
```bash
npm run build:win
```

macOS:
```bash
npm run build:mac
```

### 创建桌面快捷方式

**macOS（开发模式）:**
```bash
# 使用提供的启动脚本
chmod +x launch-app.command
# 双击 launch-app.command 即可启动应用
# 可将此文件复制到桌面作为快捷方式
```

**macOS（打包后）:**
- 按住 `⌘ + ⌥` 键，将 `AI Time Tracker.app` 拖到桌面创建别名
- 或右键点击应用，选择"制作替身"

**详细说明请查看**: [DESKTOP_SHORTCUT.md](./DESKTOP_SHORTCUT.md)

## 🎮 使用说明

### 主界面

- **开始/暂停** - 点击按钮开始或暂停计时
- **拖动窗口** - 点击窗口任意非交互区域可拖动移动
- **设置** - 点击右上角齿轮图标打开设置
- **隐藏到菜单栏** - 点击 `×` 按钮隐藏到系统托盘/菜单栏

### 菜单栏/托盘功能

- **菜单栏图标** - macOS菜单栏显示时钟图标（优先使用icon.png，否则使用内置白色线条时钟图标）
- **左键点击图标** - 快速切换显示/隐藏主窗口，并自动置顶聚焦
- **右键菜单** - 提供"显示窗口/隐藏窗口"（动态切换）和"退出应用"选项
- **ToolTip提示** - 鼠标悬停在图标上显示 "AI Time Tracker"
- **常驻运行** - 应用会常驻在系统菜单栏（macOS）或托盘（Windows），不会在Dock/任务栏显示
- **关闭窗口** - 点击关闭按钮只会隐藏窗口，不会退出应用
- **深色模式** - macOS菜单栏图标自动适配系统深色/浅色模式

### 设置界面

- **工具名称** - 自定义每个工具的显示名称
- **每日目标** - 设置每个工具的每日目标时长（小时）
- **时间修正** - 手动增加或减少工具的剩余时间
- **窗口透明度** - 调整窗口的透明度（70%-100%）
- **开机启动** - 设置是否随系统启动

### 状态说明

- **正在运行** - 蓝色高亮显示
- **临界警告** - 剩余时间<10分钟时显示红色
- **今日回本** - 完成目标时长后显示庆祝信息

## 📁 数据存储

所有数据自动保存在：
- Windows: `%APPDATA%/ai-time-tracker/data.json`
- macOS: `~/Library/Application Support/ai-time-tracker/data.json`
- Linux: `~/.config/ai-time-tracker/data.json`

## 🛠️ 技术栈

- **Electron** - 跨平台桌面应用框架
- **原生 JavaScript** - 无额外框架依赖
- **CSS3** - 科技风渐变设计

## 📝 数据结构

```json
{
  "lastSavedDate": "2025-11-05",
  "currentWeekStart": "2025-11-04",
  "windowPosition": { "x": 100, "y": 100 },
  "globalSettings": {
    "opacity": 0.85,
    "startOnBoot": false
  },
  "tools": [
    {
      "name": "Chatgpt Plus",
      "dailyLimitSeconds": 7200,
      "remainingSeconds": 6800,
      "dailyUsedSeconds": 400,
      "weeklyUsedSeconds": 2400,
      "isRunning": true
    }
  ]
}
```

## 🔄 自动重置机制

- **每日重置** - 每天午夜00:00自动重置所有计时器
- **每周重置** - 每周一自动重置周统计数据

## 💡 提示

1. 应用会自动保存窗口位置，下次启动时恢复
2. 关闭窗口不会退出应用，而是隐藏到系统托盘
3. 右键点击托盘图标可以恢复窗口或退出应用
4. 所有设置修改都会立即生效

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**享受高效的AI使用时间管理！🚀**
