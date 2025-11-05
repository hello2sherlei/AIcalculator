# Bug修复说明

## 修复的问题

### 问题1: macOS菜单栏图标为空

**问题描述**:
- macOS菜单栏上看不到任何图标，显示为空

**问题原因**:
- 之前使用SVG转DataURL的方式创建图标，在某些macOS/Electron版本上不兼容
- `nativeImage.createFromDataURL()` 对SVG的支持不稳定

**解决方案**:
1. 创建实际的PNG图标文件 (`icon.png`)
2. 修改 `createClockIcon()` 函数使用PNG格式的base64编码
3. 使用 `nativeImage.createFromBuffer()` 加载图标
4. 添加详细的日志输出，便于调试

**验证方法**:
```bash
# 查看图标文件
ls -lh icon.png
file icon.png  # 应显示: PNG image data, 16 x 16

# 运行应用后查看控制台日志
# 应显示: ✓ 创建内置时钟图标: 成功
#        图标尺寸: { width: 16, height: 16 }
```

### 问题2: 窗口隐藏后计时暂停

**问题描述**:
- 点击缩小按钮或隐藏窗口后，计时器停止工作
- 后台无法继续计时

**问题原因**:
- 计时逻辑在渲染进程中使用 `setInterval`
- 浏览器会对隐藏/后台标签页的定时器进行throttle（节流）
- 导致窗口不可见时，定时器不准确或暂停

**解决方案**:
1. **将计时逻辑移到主进程**:
   - 在 `main.js` 中添加 `startMainTimer()` 函数
   - 主进程的定时器不受窗口可见性影响
   - 确保后台持续、准确计时

2. **主进程计时器功能**:
   - 每秒更新所有运行中的工具
   - 自动保存数据
   - 通过IPC通知渲染进程更新UI

3. **渲染进程职责变更**:
   - 移除本地的 `updateTimers` 定时器
   - 监听主进程的 `timer-update` 事件
   - 仅负责UI渲染，不再管理计时逻辑

**代码变更**:

`main.js`:
```javascript
// 主进程计时器（后台持续运行）
function startMainTimer() {
  timerInterval = setInterval(() => {
    const data = loadData();
    let hasChanges = false;

    data.tools.forEach(tool => {
      if (tool.isRunning && tool.remainingSeconds > 0) {
        tool.remainingSeconds--;
        tool.dailyUsedSeconds++;
        tool.weeklyUsedSeconds++;
        hasChanges = true;
      }
    });

    if (hasChanges) {
      saveData(data);
      // 通知渲染进程
      mainWindow.webContents.send('timer-update', data);
    }
  }, 1000);
}
```

`renderer.js`:
```javascript
// 监听主进程的计时器更新
ipcRenderer.on('timer-update', (event, data) => {
  appData = data;
  renderToolsList();
  updateStats();
});
```

**验证方法**:
1. 启动应用
2. 开始某个工具的计时
3. 隐藏窗口或最小化
4. 等待30秒后重新打开
5. 确认时间继续在倒计时（已减少30秒）

## 技术改进

### 图标系统
- ✅ 使用实际的PNG文件而不是SVG
- ✅ 提供图标生成脚本 `generate-icon.js`
- ✅ 支持自定义icon.png替换
- ✅ 添加详细的调试日志

### 计时系统
- ✅ 主进程管理计时逻辑（后台持续运行）
- ✅ 渲染进程仅负责UI（降低复杂度）
- ✅ IPC通信保持数据同步
- ✅ 自动保存防止数据丢失

## 测试清单

- [ ] macOS菜单栏图标正常显示
- [ ] 图标支持深色/浅色模式自动适配
- [ ] 开始计时后正常倒计时
- [ ] 隐藏窗口后计时继续运行
- [ ] 重新显示窗口后时间正确
- [ ] 达到目标时长后自动暂停并显示"回本"提示
- [ ] 数据自动保存不丢失
- [ ] 左键点击图标切换显示/隐藏
- [ ] 右键菜单功能正常

## 注意事项

1. **图标文件**: 项目现在包含默认的 `icon.png` 文件，确保图标正常显示
2. **自定义图标**: 可以替换 `icon.png` 为自定义图标（建议16x16或22x22像素）
3. **控制台日志**: 运行应用时查看控制台日志，确认图标和计时器状态
4. **后台运行**: 现在计时器在主进程运行，即使关闭所有窗口也会继续计时（直到退出应用）

## 文件变更

- ✅ `main.js` - 添加主进程计时器和PNG图标支持
- ✅ `renderer.js` - 移除本地计时逻辑，改为监听主进程更新
- ✅ `icon.png` - 新增默认图标文件
- ✅ `generate-icon.js` - 新增图标生成脚本
- ✅ `BUGFIX.md` - 本文档
