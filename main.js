const { app, BrowserWindow, ipcMain, Tray, Menu, screen } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;
let settingsWindow = null;
let tray = null;
let timerInterval = null; // 主进程计时器
const DATA_FILE = path.join(app.getPath('userData'), 'data.json');

// 默认数据
function getDefaultData() {
  const today = new Date().toISOString().split('T')[0];
  const weekStart = getWeekStart(new Date()).toISOString().split('T')[0];

  return {
    lastSavedDate: today,
    currentWeekStart: weekStart,
    windowPosition: { x: 100, y: 100 },
    globalSettings: {
      opacity: 0.85,
      startOnBoot: false
    },
    tools: [
      {
        name: "Chatgpt Plus",
        dailyLimitSeconds: 7200,
        remainingSeconds: 7200,
        dailyUsedSeconds: 0,
        weeklyUsedSeconds: 0,
        isRunning: false
      },
      {
        name: "Claude Pro",
        dailyLimitSeconds: 7200,
        remainingSeconds: 7200,
        dailyUsedSeconds: 0,
        weeklyUsedSeconds: 0,
        isRunning: false
      },
      {
        name: "Gemini Pro",
        dailyLimitSeconds: 7200,
        remainingSeconds: 7200,
        dailyUsedSeconds: 0,
        weeklyUsedSeconds: 0,
        isRunning: false
      },
      {
        name: "即梦AI",
        dailyLimitSeconds: 7200,
        remainingSeconds: 7200,
        dailyUsedSeconds: 0,
        weeklyUsedSeconds: 0,
        isRunning: false
      }
    ]
  };
}

// 获取本周开始日期（周一）
function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

// 读取数据
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      const today = new Date().toISOString().split('T')[0];
      const weekStart = getWeekStart(new Date()).toISOString().split('T')[0];

      // 检查是否需要每日重置
      if (data.lastSavedDate !== today) {
        data.tools.forEach(tool => {
          tool.remainingSeconds = tool.dailyLimitSeconds;
          tool.dailyUsedSeconds = 0;
          tool.isRunning = false;
        });
        data.lastSavedDate = today;
      }

      // 检查是否需要每周重置
      if (data.currentWeekStart !== weekStart) {
        data.tools.forEach(tool => {
          tool.weeklyUsedSeconds = 0;
        });
        data.currentWeekStart = weekStart;
      }

      return data;
    }
  } catch (error) {
    console.error('读取数据失败:', error);
  }
  return getDefaultData();
}

// 保存数据
function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('保存数据失败:', error);
  }
}

// 创建内置时钟图标（白色线条圆表盘）
function createClockIcon() {
  const { nativeImage } = require('electron');

  // 使用PNG格式的base64编码图标（22x22像素的简洁时钟图标）
  // 这是一个黑色的时钟图标，适合macOS Template Image
  const base64Icon = 'iVBORw0KGgoAAAANSUhEUgAAABYAAAAWCAYAAADEtGw7AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEgAACxIB0t1+/AAAABR0RVh0Q3JlYXRpb24gVGltZQAxMS81LzI1GMZM2QAAAB10RVh0U29mdHdhcmUAQWRvYmUgRmlyZXdvcmtzIENTNui8sowAAAFlSURBVEiJ7ZTPSsNAEMZ/k6YNgohF8OBJ8OJT+AQ+gk/gA/gAPoBXL/oIXhQPgoh4qCAIFqEqVGt3x0NSE5JNs/VQ/GDJZnf2m29nZ2eU1ppzopxz8j/xPU8cx8RxjFKKIAiYTCZN0JMCjBgjh8MBgNVqxWQyYTgcAnBVwFEU4TgOvu9TJhVvFX0cx6zXa8qiZJRSGGNwHOcsZd8VRxH7/R5jDJ7nsdvtAEjTlCRJfjU+Sdd1qdfrGGPodrsA9Pt9Go1GBauUqoS9EWazGUmSlIpPDqeWb7dblFK0222UUrTbbTzPK7gG1oUCLYxarbYHqoO01ux2O5IkodvtYq3FWnt0v91uGY/HPDw8APQK8UEulO/3+7iuu9/tdqJpmsI0TWGaZi0IAjkYDBZCCCmEkEIImSRJxSxdG5afUwBWnuf5f8WyHCvG1lrRarVYLBYV74/6/Bj6AtpD15wy6mhrAAAAAElFTkSuQmCC';

  const icon = nativeImage.createFromBuffer(Buffer.from(base64Icon, 'base64'));

  // 在macOS上，设置为Template Image以支持深色模式
  if (process.platform === 'darwin') {
    icon.setTemplateImage(true);
  }

  console.log('✓ 创建内置时钟图标:', icon.isEmpty() ? '失败（图标为空）' : '成功');
  console.log('  图标尺寸:', icon.getSize());

  return icon;
}

// 更新托盘菜单
function updateTrayMenu() {
  if (!tray || !mainWindow) return;

  const isVisible = mainWindow.isVisible();

  const contextMenu = Menu.buildFromTemplate([
    {
      label: isVisible ? '隐藏窗口' : '显示窗口',
      click: () => {
        if (mainWindow) {
          if (mainWindow.isVisible()) {
            mainWindow.hide();
          } else {
            mainWindow.show();
            mainWindow.focus();
          }
        }
      }
    },
    {
      type: 'separator'
    },
    {
      label: '退出',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
}

// 创建系统托盘
function createTray() {
  let icon;

  // 优先加载项目根目录的 icon.png
  const iconPath = path.join(__dirname, 'icon.png');

  if (fs.existsSync(iconPath)) {
    // 使用自定义图标
    const { nativeImage } = require('electron');
    icon = nativeImage.createFromPath(iconPath);

    // 在macOS上，如果是单色图标，设置为Template Image
    if (process.platform === 'darwin') {
      // 可以调整图标大小以适配菜单栏
      icon = icon.resize({ width: 22, height: 22 });
      icon.setTemplateImage(true);
    }

    console.log('✓ 已加载自定义图标: icon.png');
  } else {
    // 使用内置时钟图标
    icon = createClockIcon();
    console.log('ℹ icon.png 不存在，使用内置时钟图标');
  }

  // 创建托盘
  try {
    tray = new Tray(icon);
    tray.setToolTip('AI Time Tracker');

    // 左键点击切换显示/隐藏
    tray.on('click', () => {
      if (mainWindow) {
        if (mainWindow.isVisible()) {
          mainWindow.hide();
        } else {
          mainWindow.show();
          mainWindow.focus();
        }
        updateTrayMenu();
      }
    });

    // 初始化菜单
    updateTrayMenu();

    console.log('✓ 托盘图标创建成功');
  } catch (error) {
    console.error('✗ 无法创建托盘图标:', error);
  }
}

function createMainWindow() {
  const data = loadData();
  const displays = screen.getAllDisplays();
  const primaryDisplay = displays[0];

  // 确保窗口位置在屏幕范围内
  let x = data.windowPosition.x;
  let y = data.windowPosition.y;

  if (x < 0 || x > primaryDisplay.bounds.width - 300) {
    x = 100;
  }
  if (y < 0 || y > primaryDisplay.bounds.height - 400) {
    y = 100;
  }

  mainWindow = new BrowserWindow({
    width: 320,
    height: 550,
    x: x,
    y: y,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true, // 在Windows任务栏和macOS Dock中隐藏
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile('index.html');

  // 开发时可以打开开发者工具
  // mainWindow.webContents.openDevTools();

  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      updateTrayMenu();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 最小化时隐藏到托盘
  mainWindow.on('minimize', (event) => {
    event.preventDefault();
    mainWindow.hide();
    updateTrayMenu();
  });

  // 窗口显示/隐藏时更新托盘菜单
  mainWindow.on('show', () => {
    updateTrayMenu();
  });

  mainWindow.on('hide', () => {
    updateTrayMenu();
  });

  // 保存窗口位置
  mainWindow.on('moved', () => {
    const position = mainWindow.getPosition();
    const data = loadData();
    data.windowPosition = { x: position[0], y: position[1] };
    saveData(data);
  });
}

// 启动主进程计时器（确保后台持续计时）
function startMainTimer() {
  // 清除现有计时器
  if (timerInterval) {
    clearInterval(timerInterval);
  }

  // 每秒更新一次计时
  timerInterval = setInterval(() => {
    const data = loadData();
    let hasChanges = false;

    // 更新所有正在运行的工具
    data.tools.forEach(tool => {
      if (tool.isRunning && tool.remainingSeconds > 0) {
        tool.remainingSeconds = Math.max(0, tool.remainingSeconds - 1);
        tool.dailyUsedSeconds += 1;
        tool.weeklyUsedSeconds += 1;
        hasChanges = true;

        // 如果时间到了，自动暂停
        if (tool.remainingSeconds <= 0) {
          tool.isRunning = false;
          console.log(`⏰ ${tool.name} 已完成今日目标！`);
        }
      }
    });

    // 如果有变化，保存数据并通知渲染进程
    if (hasChanges) {
      saveData(data);

      // 通知渲染进程更新UI
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('timer-update', data);
      }
    }
  }, 1000);

  console.log('✓ 主进程计时器已启动（后台持续运行）');
}

// 停止主进程计时器
function stopMainTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
    console.log('✓ 主进程计时器已停止');
  }
}

function createSettingsWindow() {
  if (settingsWindow) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 500,
    height: 600,
    parent: mainWindow,
    modal: true,
    frame: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  settingsWindow.loadFile('settings.html');
  settingsWindow.setMenu(null);

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

app.whenReady().then(() => {
  createMainWindow();
  createTray();
  startMainTimer(); // 启动主进程计时器

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  app.isQuitting = true;
  stopMainTimer(); // 停止主进程计时器
});

// IPC 事件处理
ipcMain.handle('load-data', () => {
  return loadData();
});

ipcMain.handle('save-data', (event, data) => {
  saveData(data);
  return { success: true };
});

ipcMain.handle('open-settings', () => {
  createSettingsWindow();
});

ipcMain.handle('set-opacity', (event, opacity) => {
  if (mainWindow) {
    mainWindow.setOpacity(opacity);
  }
});

ipcMain.handle('quit-app', () => {
  app.isQuitting = true;
  app.quit();
});

// 设置开机启动
ipcMain.handle('set-auto-launch', (event, enabled) => {
  app.setLoginItemSettings({
    openAtLogin: enabled
  });
  return { success: true };
});

ipcMain.handle('get-auto-launch', () => {
  return app.getLoginItemSettings().openAtLogin;
});

ipcMain.handle('hide-window', () => {
  if (mainWindow) {
    mainWindow.hide();
  }
});

ipcMain.handle('notify-main-window', () => {
  if (mainWindow) {
    mainWindow.webContents.send('data-updated');
  }
});
