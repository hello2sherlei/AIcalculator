const { ipcRenderer } = require('electron');

let appData = null;

// 格式化秒数为小时
function secondsToHours(seconds) {
  return (seconds / 3600).toFixed(1);
}

// 小时转秒数
function hoursToSeconds(hours) {
  return Math.round(hours * 3600);
}

// 渲染工具设置
function renderToolsSettings() {
  const container = document.getElementById('toolsSettings');
  container.innerHTML = '';

  appData.tools.forEach((tool, index) => {
    const toolDiv = document.createElement('div');
    toolDiv.className = 'tool-setting';

    // 工具名称
    const nameGroup = document.createElement('div');
    nameGroup.className = 'input-group';
    nameGroup.innerHTML = `
      <label>工具名称</label>
      <input type="text" class="tool-name" data-index="${index}" value="${tool.name}">
    `;

    // 每日目标时长
    const limitGroup = document.createElement('div');
    limitGroup.className = 'input-group';
    limitGroup.innerHTML = `
      <label>每日目标时长（小时）</label>
      <input type="number" class="tool-limit" data-index="${index}" value="${secondsToHours(tool.dailyLimitSeconds)}" min="0.1" max="24" step="0.1">
    `;

    // 时间修正
    const adjustGroup = document.createElement('div');
    adjustGroup.className = 'input-group';
    adjustGroup.innerHTML = `
      <label>剩余时间修正（分钟）</label>
    `;

    const adjustButtons = document.createElement('div');
    adjustButtons.className = 'time-adjust';
    adjustButtons.innerHTML = `
      <button class="decrease" data-index="${index}" data-action="decrease">-10 分钟</button>
      <button data-index="${index}" data-action="increase">+10 分钟</button>
    `;

    adjustGroup.appendChild(adjustButtons);

    toolDiv.appendChild(nameGroup);
    toolDiv.appendChild(limitGroup);
    toolDiv.appendChild(adjustGroup);

    container.appendChild(toolDiv);
  });

  // 绑定修正按钮事件
  document.querySelectorAll('.time-adjust button').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      const action = e.target.dataset.action;
      const minutes = action === 'increase' ? 10 : -10;
      adjustTime(index, minutes);
    });
  });
}

// 调整时间
function adjustTime(index, minutes) {
  const seconds = minutes * 60;
  appData.tools[index].remainingSeconds = Math.max(0, appData.tools[index].remainingSeconds + seconds);

  // 如果增加时间，也更新每日限制
  if (minutes > 0 && appData.tools[index].remainingSeconds > appData.tools[index].dailyLimitSeconds) {
    appData.tools[index].dailyLimitSeconds = appData.tools[index].remainingSeconds;
    renderToolsSettings();
  }

  alert(`${appData.tools[index].name} 剩余时间已${minutes > 0 ? '增加' : '减少'} ${Math.abs(minutes)} 分钟`);
}

// 加载数据
async function loadData() {
  try {
    appData = await ipcRenderer.invoke('load-data');
    renderToolsSettings();

    // 加载全局设置
    const opacity = appData.globalSettings.opacity || 0.85;
    document.getElementById('opacitySlider').value = opacity * 100;
    document.getElementById('opacityValue').textContent = `${Math.round(opacity * 100)}%`;

    // 加载开机启动设置
    const autoLaunch = await ipcRenderer.invoke('get-auto-launch');
    document.getElementById('startOnBoot').checked = autoLaunch;
  } catch (error) {
    console.error('加载数据失败:', error);
  }
}

// 保存设置
async function saveSettings() {
  try {
    // 保存工具名称和限制
    document.querySelectorAll('.tool-name').forEach(input => {
      const index = parseInt(input.dataset.index);
      appData.tools[index].name = input.value;
    });

    document.querySelectorAll('.tool-limit').forEach(input => {
      const index = parseInt(input.dataset.index);
      const hours = parseFloat(input.value);
      appData.tools[index].dailyLimitSeconds = hoursToSeconds(hours);
    });

    // 保存全局设置
    const opacity = parseInt(document.getElementById('opacitySlider').value) / 100;
    appData.globalSettings.opacity = opacity;

    const startOnBoot = document.getElementById('startOnBoot').checked;
    appData.globalSettings.startOnBoot = startOnBoot;

    // 保存数据
    await ipcRenderer.invoke('save-data', appData);

    // 设置透明度
    await ipcRenderer.invoke('set-opacity', opacity);

    // 设置开机启动
    await ipcRenderer.invoke('set-auto-launch', startOnBoot);

    // 通知主窗口更新
    await ipcRenderer.invoke('notify-main-window');

    alert('设置已保存');
    window.close();
  } catch (error) {
    console.error('保存设置失败:', error);
    alert('保存设置失败：' + error.message);
  }
}

// 初始化
function init() {
  loadData();

  // 透明度滑块
  document.getElementById('opacitySlider').addEventListener('input', (e) => {
    const value = e.target.value;
    document.getElementById('opacityValue').textContent = `${value}%`;
  });

  // 保存按钮
  document.getElementById('saveBtn').addEventListener('click', saveSettings);

  // 取消按钮
  document.getElementById('cancelBtn').addEventListener('click', () => {
    window.close();
  });
}

window.addEventListener('DOMContentLoaded', init);
