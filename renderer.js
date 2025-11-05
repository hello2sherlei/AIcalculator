const { ipcRenderer } = require('electron');

let appData = null;
let updateInterval = null;
let saveInterval = null;

// 格式化秒数为 HH:MM:SS
function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// 渲染工具列表
function renderToolsList() {
  const toolsList = document.getElementById('toolsList');
  toolsList.innerHTML = '';

  appData.tools.forEach((tool, index) => {
    const toolItem = document.createElement('div');
    toolItem.className = 'tool-item';

    // 判断状态
    const isCompleted = tool.remainingSeconds <= 0;
    const isWarning = tool.remainingSeconds > 0 && tool.remainingSeconds < 600; // 10分钟
    const isRunning = tool.isRunning;

    if (isCompleted) {
      toolItem.classList.add('completed');
    } else if (isWarning) {
      toolItem.classList.add('warning');
    }
    if (isRunning) {
      toolItem.classList.add('running');
    }

    // 计算进度
    const progress = Math.max(0, Math.min(100, (tool.remainingSeconds / tool.dailyLimitSeconds) * 100));

    // 工具头部
    const toolHeader = document.createElement('div');
    toolHeader.className = 'tool-header';

    const toolName = document.createElement('div');
    toolName.className = 'tool-name';
    toolName.textContent = tool.name;

    const toolTime = document.createElement('div');
    toolTime.className = 'tool-time';
    toolTime.textContent = formatTime(Math.max(0, tool.remainingSeconds));

    toolHeader.appendChild(toolName);
    toolHeader.appendChild(toolTime);

    // 进度条
    const progressContainer = document.createElement('div');
    progressContainer.className = 'progress-container';

    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    progressBar.style.width = `${progress}%`;

    progressContainer.appendChild(progressBar);

    // 工具底部
    const toolFooter = document.createElement('div');
    toolFooter.className = 'tool-footer';

    const toolStatus = document.createElement('div');
    toolStatus.className = 'tool-status';
    if (isCompleted) {
      toolStatus.textContent = '恭喜今日回本 🎉';
    } else {
      toolStatus.textContent = `已用 ${formatTime(tool.dailyUsedSeconds)}`;
    }

    const controlBtn = document.createElement('button');
    controlBtn.className = 'control-btn';

    if (isCompleted) {
      controlBtn.textContent = '修正';
      controlBtn.classList.add('reset');
      controlBtn.onclick = () => openSettings();
    } else {
      if (isRunning) {
        controlBtn.textContent = '暂停';
        controlBtn.classList.add('pause');
      } else {
        controlBtn.textContent = '开始';
      }
      controlBtn.onclick = () => toggleTool(index);
    }

    toolFooter.appendChild(toolStatus);
    toolFooter.appendChild(controlBtn);

    // 组装
    toolItem.appendChild(toolHeader);
    toolItem.appendChild(progressContainer);
    toolItem.appendChild(toolFooter);

    toolsList.appendChild(toolItem);
  });
}

// 更新统计
function updateStats() {
  let dailyTotal = 0;
  let weeklyTotal = 0;

  appData.tools.forEach(tool => {
    dailyTotal += tool.dailyUsedSeconds;
    weeklyTotal += tool.weeklyUsedSeconds;
  });

  document.getElementById('dailyTotal').textContent = formatTime(dailyTotal);
  document.getElementById('weeklyTotal').textContent = formatTime(weeklyTotal);
}

// 切换工具的运行状态
function toggleTool(index) {
  const tool = appData.tools[index];

  if (tool.remainingSeconds <= 0) {
    return;
  }

  tool.isRunning = !tool.isRunning;
  renderToolsList();
  saveData();
}

// 更新计时器（每秒）
function updateTimers() {
  let hasChanges = false;

  appData.tools.forEach(tool => {
    if (tool.isRunning && tool.remainingSeconds > 0) {
      tool.remainingSeconds = Math.max(0, tool.remainingSeconds - 1);
      tool.dailyUsedSeconds += 1;
      tool.weeklyUsedSeconds += 1;
      hasChanges = true;

      // 如果时间到了，自动暂停
      if (tool.remainingSeconds <= 0) {
        tool.isRunning = false;
      }
    }
  });

  if (hasChanges) {
    renderToolsList();
    updateStats();
  }
}

// 保存数据
async function saveData() {
  try {
    await ipcRenderer.invoke('save-data', appData);
  } catch (error) {
    console.error('保存数据失败:', error);
  }
}

// 加载数据
async function loadData() {
  try {
    appData = await ipcRenderer.invoke('load-data');
    renderToolsList();
    updateStats();

    // 应用透明度设置
    if (appData.globalSettings && appData.globalSettings.opacity) {
      await ipcRenderer.invoke('set-opacity', appData.globalSettings.opacity);
    }
  } catch (error) {
    console.error('加载数据失败:', error);
  }
}

// 打开设置
function openSettings() {
  ipcRenderer.invoke('open-settings');
}

// 初始化
async function init() {
  await loadData();

  // 每秒更新计时器
  updateInterval = setInterval(updateTimers, 1000);

  // 每秒保存数据
  saveInterval = setInterval(saveData, 1000);

  // 绑定头部按钮
  document.getElementById('settingsBtn').onclick = openSettings;

  document.getElementById('closeBtn').onclick = async () => {
    await ipcRenderer.invoke('hide-window');
  };
}

// 监听来自设置窗口的更新
ipcRenderer.on('data-updated', async () => {
  await loadData();
});

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', init);

// 页面卸载时清理
window.addEventListener('beforeunload', () => {
  if (updateInterval) clearInterval(updateInterval);
  if (saveInterval) clearInterval(saveInterval);
  saveData();
});
