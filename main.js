const { app, BrowserWindow, ipcMain, Tray, Menu, screen } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;
let settingsWindow = null;
let tray = null;
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

// 创建系统托盘
function createTray() {
  // 尝试加载图标，如果不存在则创建一个临时的
  let iconPath = path.join(__dirname, 'icon.png');

  // 检查图标是否存在，不存在则尝试使用nativeImage创建
  if (!fs.existsSync(iconPath)) {
    const { nativeImage } = require('electron');
    // 创建一个简单的空图标
    const icon = nativeImage.createEmpty();
    try {
      tray = new Tray(icon);
    } catch (error) {
      console.warn('无法创建托盘图标:', error);
      return;
    }
  } else {
    tray = new Tray(iconPath);
  }

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示窗口',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
        }
      }
    },
    {
      label: '退出',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip('AI Time Tracker');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
      }
    }
  });
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
    skipTaskbar: false,
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
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 保存窗口位置
  mainWindow.on('moved', () => {
    const position = mainWindow.getPosition();
    const data = loadData();
    data.windowPosition = { x: position[0], y: position[1] };
    saveData(data);
  });
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

ipcMain.handle('minimize-window', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
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
