/**
 * FocusMode — Premium Focus/Productivity App
 * app.js — Full application logic
 */

/* ════════════════════════════════════════════════
   CONFIGURATION & CONSTANTS
════════════════════════════════════════════════ */

const BACKGROUNDS = [
  'image 1.jpg',
  'image 2.jpg',
  'image 3.jpg',
  'image 4.jpg',
];

const QUOTES = [
  "I am connected to the bigger vision.",
  "Small progress is still progress.",
  "One task at a time.",
  "Consistency beats intensity.",
  "Stay focused. Your future self will thank you.",
  "Keep going.",
  "Focus on the process.",
  "Your future is built one session at a time.",
  "Every expert was once a beginner.",
  "The secret of getting ahead is getting started.",
  "Do one thing at a time, and do it well.",
  "Discipline is the bridge between goals and accomplishment.",
  "You don't have to be great to start. Start to be great.",
  "Be present. Be here. Be focused.",
  "Progress, not perfection.",
];

const FOCUS_DURATIONS = [1, 5, 10, 15, 20, 25, 30, 45, 50, 60, 90];

const BREAK_SUGGESTIONS = {
  1:  1,
  5:  1,
  10: 2,
  15: 3,
  20: 4,
  25: 5,
  30: 6,
  45: 9,
  50: 10,
  60: 12,
  90: 20,
};

const STORAGE_KEY = 'focusmode_v2';

/* ════════════════════════════════════════════════
   STATE
════════════════════════════════════════════════ */

let state = {
  // Timer
  mode: 'focus',           // 'focus' | 'break'
  timerRunning: false,
  timerStartTime: null,    // timestamp when timer started (ms)
  timerEndTime: null,      // timestamp when timer should end (ms)
  timerRemaining: 0,       // remaining ms at last pause
  sessionCount: 1,

  // Settings
  focusDuration: 25,       // minutes
  breakDuration: 5,
  longBreakDuration: 15,
  sessionsBeforeLongBreak: 4,
  autostartFocus: false,
  autostartBreak: false,
  hideSeconds: false,
  soundEffects: true,
  ambientEnabled: false,
  volume: 60,
  notifications: false,

  // Focus Topic
  focusTopic: '',

  // Focus Mode
  focusModeActive: false,

  // Tasks
  tasks: [],

  // Background
  lastBgIndex: -1,
  currentBgIndex: 0,

  // UI
  menuOpen: false,
  settingsOpen: false,
  lastQuoteIndex: -1,
  currentQuoteIndex: -1,
};

let tickInterval = null;
let audioCtx = null;

/* ════════════════════════════════════════════════
   DOM REFERENCES
════════════════════════════════════════════════ */

const dom = {
  bgLayer: document.getElementById('bg-layer'),
  focusHeader: document.getElementById('focus-header'),
  stopFocusBtn: document.getElementById('stop-focus-btn'),

  timerDisplay: document.getElementById('timer-display'),
  progressCircle: document.getElementById('ring-progress-circle'),

  focusTab: document.getElementById('focus-tab'),
  breakTab: document.getElementById('break-tab'),

  topicText: document.getElementById('topic-text'),
  topicDisplay: document.querySelector('.focus-topic-display'),
  topicInputOverlay: document.getElementById('topic-input-overlay'),
  topicInput: document.getElementById('topic-input'),

  playPauseBtn: document.getElementById('play-pause-btn'),
  playIcon: document.getElementById('play-icon'),
  pauseIcon: document.getElementById('pause-icon'),

  threeDotBtn: document.getElementById('three-dot-btn'),
  pomodoroMenu: document.getElementById('pomodoro-menu'),

  menuComplete: document.getElementById('menu-complete'),
  menuRestart: document.getElementById('menu-restart'),
  menuAdd5: document.getElementById('menu-add5'),
  menuAdd10: document.getElementById('menu-add10'),
  menuFocusDur: document.getElementById('menu-focus-dur'),
  menuBreakDur: document.getElementById('menu-break-dur'),
  toggleSoundEffects: document.getElementById('toggle-sound-effects'),
  toggleAutostart: document.getElementById('toggle-autostart'),
  toggleHideSeconds: document.getElementById('toggle-hide-seconds'),
  toggleNotifications: document.getElementById('toggle-notifications'),

  tasksList: document.getElementById('tasks-list'),
  addTaskBtn: document.getElementById('add-task-btn'),
  addTaskForm: document.getElementById('add-task-form'),
  newTaskInput: document.getElementById('new-task-input'),
  saveTaskBtn: document.getElementById('save-task-btn'),
  cancelTaskBtn: document.getElementById('cancel-task-btn'),

  soundToggleBtn: document.getElementById('sound-toggle-btn'),
  soundIcon: document.getElementById('sound-icon'),
  volumeSliderWrap: document.getElementById('volume-slider-wrap'),
  volumeSlider: document.getElementById('volume-slider'),
  settingsBtn: document.getElementById('settings-btn'),
  fullscreenBtn: document.getElementById('fullscreen-btn'),
  sessionCountDisplay: document.getElementById('session-count-display'),

  completionNotification: document.getElementById('completion-notification'),
  continueFocusBtn: document.getElementById('continue-focus-btn'),
  stopFocusModeBtn: document.getElementById('stop-focus-mode-btn'),

  breakNotification: document.getElementById('break-notification'),
  startFocusAgainBtn: document.getElementById('start-focus-again-btn'),
  dismissBreakBtn: document.getElementById('dismiss-break-btn'),

  settingsPanel: document.getElementById('settings-panel'),
  settingsOverlay: document.getElementById('settings-overlay'),
  closeSettingsBtn: document.getElementById('close-settings-btn'),
  settingsFocusDur: document.getElementById('settings-focus-dur'),
  settingsFocusCustom: document.getElementById('settings-focus-custom'),
  settingsBreakDur: document.getElementById('settings-break-dur'),
  settingsBreakCustom: document.getElementById('settings-break-custom'),
  settingsLongBreakDur: document.getElementById('settings-long-break-dur'),
  settingsLongBreakCustom: document.getElementById('settings-long-break-custom'),
  settingsSessions: document.getElementById('settings-sessions'),
  settingsAutostartFocus: document.getElementById('settings-autostart-focus'),
  settingsAutostartBreak: document.getElementById('settings-autostart-break'),
  settingsHideSeconds: document.getElementById('settings-hide-seconds'),
  settingsSoundEffects: document.getElementById('settings-sound-effects'),
  settingsAmbient: document.getElementById('settings-ambient'),
  settingsVolume: document.getElementById('settings-volume'),
  settingsNotifications: document.getElementById('settings-notifications'),
  saveSettingsBtn: document.getElementById('save-settings-btn'),

  quote: document.getElementById('motivational-quote'),
  confettiContainer: document.getElementById('confetti-container'),
  ambientAudio: document.getElementById('ambient-audio'),
};

/* ════════════════════════════════════════════════
   PROGRESS RING SETUP
════════════════════════════════════════════════ */

const RING_RADIUS = 175;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function initRing() {
  dom.progressCircle.style.strokeDasharray = RING_CIRCUMFERENCE;
  dom.progressCircle.style.strokeDashoffset = 0;
}

function updateRing(fraction) {
  // fraction: 1 = full (start), 0 = empty (done)
  const offset = RING_CIRCUMFERENCE * (1 - fraction);
  dom.progressCircle.style.strokeDashoffset = offset;
}

/* ════════════════════════════════════════════════
   LOCAL STORAGE
════════════════════════════════════════════════ */

function saveState() {
  const persist = {
    focusDuration: state.focusDuration,
    breakDuration: state.breakDuration,
    longBreakDuration: state.longBreakDuration,
    sessionsBeforeLongBreak: state.sessionsBeforeLongBreak,
    autostartFocus: state.autostartFocus,
    autostartBreak: state.autostartBreak,
    hideSeconds: state.hideSeconds,
    soundEffects: state.soundEffects,
    ambientEnabled: state.ambientEnabled,
    volume: state.volume,
    notifications: state.notifications,
    focusTopic: state.focusTopic,
    tasks: state.tasks,
    sessionCount: state.sessionCount,
    lastBgIndex: state.currentBgIndex,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(persist));
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    Object.assign(state, saved);
    // lastBgIndex stored as previous bg
    state.lastBgIndex = saved.lastBgIndex !== undefined ? saved.lastBgIndex : -1;
  } catch (e) {
    console.warn('Could not load saved state:', e);
  }
}

/* ════════════════════════════════════════════════
   BACKGROUND MANAGEMENT
════════════════════════════════════════════════ */

function pickBackground() {
  let idx;
  const avail = BACKGROUNDS.length;
  if (avail === 1) {
    idx = 0;
  } else {
    do {
      idx = Math.floor(Math.random() * avail);
    } while (idx === state.lastBgIndex);
  }
  state.currentBgIndex = idx;
  return BACKGROUNDS[idx];
}

function cssUrl(filename) {
  // Escape quotes and backslashes inside CSS string; spaces are fine inside quotes
  return `url("${filename.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}")`;
}

function setBackground(filename) {
  dom.bgLayer.style.opacity = '0';
  setTimeout(() => {
    dom.bgLayer.style.backgroundImage = cssUrl(filename);
    dom.bgLayer.style.opacity = '1';
  }, 300);
}

function initBackground() {
  const bg = pickBackground();
  dom.bgLayer.style.transition = 'opacity 1.2s ease';
  dom.bgLayer.style.backgroundImage = cssUrl(bg);
  dom.bgLayer.style.backgroundSize = 'cover';
  dom.bgLayer.style.backgroundPosition = 'center';
  dom.bgLayer.style.opacity = '1';
}

/* ════════════════════════════════════════════════
   TIMER LOGIC
════════════════════════════════════════════════ */

function getTotalDuration() {
  return (state.mode === 'focus' ? state.focusDuration : state.breakDuration) * 60 * 1000;
}

function formatTime(ms) {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  if (state.hideSeconds) {
    return `${String(mins).padStart(2, '0')}:--`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function getRemainingMs() {
  if (!state.timerRunning) {
    return state.timerRemaining;
  }
  const now = Date.now();
  return Math.max(0, state.timerEndTime - now);
}

function startTimer() {
  if (state.timerRunning) return;
  const remaining = state.timerRemaining > 0 ? state.timerRemaining : getTotalDuration();
  state.timerRemaining = remaining;
  state.timerStartTime = Date.now();
  state.timerEndTime = Date.now() + remaining;
  state.timerRunning = true;

  dom.playIcon.classList.add('hidden');
  dom.pauseIcon.classList.remove('hidden');

  // Enter Focus Mode if in focus mode
  if (state.mode === 'focus') {
    enterFocusMode();
  }

  // Start ambient music
  if (state.ambientEnabled && state.mode === 'focus') {
    playAmbient();
  }

  clearInterval(tickInterval);
  tickInterval = setInterval(tick, 250);
}

function pauseTimer() {
  if (!state.timerRunning) return;
  state.timerRemaining = getRemainingMs();
  state.timerRunning = false;
  clearInterval(tickInterval);

  dom.playIcon.classList.remove('hidden');
  dom.pauseIcon.classList.add('hidden');

  // Pause ambient
  pauseAmbient();

  updateDisplay();
}

function resetTimer() {
  clearInterval(tickInterval);
  state.timerRunning = false;
  state.timerRemaining = getTotalDuration();
  state.timerStartTime = null;
  state.timerEndTime = null;

  dom.playIcon.classList.remove('hidden');
  dom.pauseIcon.classList.add('hidden');

  updateDisplay();
}

function tick() {
  const remaining = getRemainingMs();
  updateDisplay(remaining);

  if (remaining <= 0) {
    clearInterval(tickInterval);
    state.timerRunning = false;
    state.timerRemaining = 0;
    onTimerComplete();
  }
}

function updateDisplay(remaining) {
  if (remaining === undefined) remaining = getRemainingMs();
  const total = getTotalDuration();
  const fraction = total > 0 ? remaining / total : 0;

  dom.timerDisplay.textContent = formatTime(remaining);
  updateRing(fraction);
}

function onTimerComplete() {
  dom.playIcon.classList.remove('hidden');
  dom.pauseIcon.classList.add('hidden');
  dom.timerDisplay.textContent = formatTime(0);
  updateRing(0);

  if (state.mode === 'focus') {
    onFocusComplete();
  } else {
    onBreakComplete();
  }
}

function addMinutes(mins) {
  const addition = mins * 60 * 1000;
  if (state.timerRunning) {
    state.timerEndTime += addition;
  } else {
    state.timerRemaining += addition;
  }
  updateDisplay();
}

/* ════════════════════════════════════════════════
   FOCUS / BREAK COMPLETION
════════════════════════════════════════════════ */

function onFocusComplete() {
  playSoundEffect('complete');
  triggerConfetti();
  sendNotification('Focus session complete!', 'Great work! Time for a break.');
  changeQuote();

  pauseAmbient();

  // Increment session count as soon as a focus session finishes
  state.sessionCount++;
  dom.sessionCountDisplay.textContent = `Session ${state.sessionCount}`;
  saveState();

  if (state.autostartBreak) {
    showCompletionNotification(true);
    setTimeout(() => {
      hideCompletionNotification();
      switchMode('break');
      startTimer();
    }, 3000);
  } else {
    showCompletionNotification(false);
  }
}

function onBreakComplete() {
  playSoundEffect('ding');
  sendNotification("Break's over!", 'Ready to focus again?');

  if (state.autostartFocus) {
    setTimeout(() => {
      switchMode('focus');
      startTimer();
    }, 1000);
  } else {
    showBreakCompleteNotification();
  }
}

function showCompletionNotification(autoMode) {
  dom.completionNotification.classList.remove('hidden');
  if (autoMode) {
    dom.continueFocusBtn.style.display = 'none';
    dom.stopFocusModeBtn.style.display = 'none';
  } else {
    dom.continueFocusBtn.style.display = '';
    dom.stopFocusModeBtn.style.display = '';
  }
}

function hideCompletionNotification() {
  dom.completionNotification.classList.add('hidden');
}

function showBreakCompleteNotification() {
  dom.breakNotification.classList.remove('hidden');
}

function hideBreakNotification() {
  dom.breakNotification.classList.add('hidden');
}

/* ════════════════════════════════════════════════
   MODE MANAGEMENT
════════════════════════════════════════════════ */

function switchMode(mode) {
  state.mode = mode;
  state.timerRunning = false;
  state.timerRemaining = 0;
  clearInterval(tickInterval);

  dom.playIcon.classList.remove('hidden');
  dom.pauseIcon.classList.add('hidden');

  if (mode === 'focus') {
    dom.focusTab.classList.add('active');
    dom.breakTab.classList.remove('active');
  } else {
    dom.breakTab.classList.add('active');
    dom.focusTab.classList.remove('active');
  }

  updateDisplay();
  saveState();
}

/* ════════════════════════════════════════════════
   FOCUS MODE
════════════════════════════════════════════════ */

function enterFocusMode() {
  state.focusModeActive = true;
  dom.focusHeader.classList.remove('hidden');
}

function exitFocusMode() {
  state.focusModeActive = false;
  dom.focusHeader.classList.add('hidden');
  pauseTimer();
  pauseAmbient();
}

/* ════════════════════════════════════════════════
   AMBIENT AUDIO
════════════════════════════════════════════════ */

function playAmbient() {
  if (!state.ambientEnabled) return;
  const audio = dom.ambientAudio;
  audio.volume = state.volume / 100;
  audio.play().catch(() => {
    // Autoplay blocked — user must interact first
  });
  updateSoundIcon(true);
}

function pauseAmbient() {
  dom.ambientAudio.pause();
  updateSoundIcon(false);
}

function updateSoundIcon(playing) {
  const on = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`;
  const off = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`;
  dom.soundToggleBtn.innerHTML = playing && state.ambientEnabled ? on : off;
}

/* ════════════════════════════════════════════════
   WEB AUDIO — SOUND EFFECTS
════════════════════════════════════════════════ */

function getAudioCtx() {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {}
  }
  return audioCtx;
}

function playSoundEffect(type) {
  if (!state.soundEffects) return;
  const ctx = getAudioCtx();
  if (!ctx) return;

  const now = ctx.currentTime;

  if (type === 'complete') {
    // Triumphant ding sequence
    const freqs = [523, 659, 784, 1047];
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0, now + i * 0.12);
      gain.gain.linearRampToValueAtTime(0.18, now + i * 0.12 + 0.03);
      gain.gain.linearRampToValueAtTime(0, now + i * 0.12 + 0.35);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.5);
    });
  } else if (type === 'ding') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
    osc.start(now);
    osc.stop(now + 1.5);
  } else if (type === 'tick') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 1200;
    osc.type = 'square';
    gain.gain.setValueAtTime(0.04, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.05);
    osc.start(now);
    osc.stop(now + 0.05);
  }
}

/* ════════════════════════════════════════════════
   BROWSER NOTIFICATIONS
════════════════════════════════════════════════ */

function sendNotification(title, body) {
  if (!state.notifications) return;
  if (Notification.permission !== 'granted') return;
  new Notification(title, { body, icon: '' });
}

function requestNotificationPermission() {
  if (Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

/* ════════════════════════════════════════════════
   CONFETTI
════════════════════════════════════════════════ */

const CONFETTI_COLORS = [
  '#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff',
  '#ff922b', '#cc5de8', '#74c0fc', '#a9e34b',
];

function triggerConfetti() {
  const container = dom.confettiContainer;
  container.innerHTML = '';
  const count = 80;

  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-piece';
    el.style.left = `${Math.random() * 100}%`;
    el.style.backgroundColor = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    el.style.width = `${6 + Math.random() * 8}px`;
    el.style.height = `${6 + Math.random() * 8}px`;
    el.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    el.style.animationDuration = `${2.5 + Math.random() * 2.5}s`;
    el.style.animationDelay = `${Math.random() * 0.8}s`;
    container.appendChild(el);
  }

  setTimeout(() => {
    container.innerHTML = '';
  }, 5500);
}

/* ════════════════════════════════════════════════
   TASKS
════════════════════════════════════════════════ */

function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

function renderTasks() {
  const today = getTodayStr();
  const todayTasks = state.tasks.filter(t => t.date === today || !t.date);
  dom.tasksList.innerHTML = '';

  todayTasks.forEach((task) => {
    const item = document.createElement('div');
    item.className = `task-item${task.completed ? ' completed' : ''}`;
    item.dataset.id = task.id;

    item.innerHTML = `
      <div class="task-checkbox">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
      <span class="task-label">${escapeHtml(task.name)}</span>
      <button class="task-delete-btn" title="Delete task">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    `;

    item.querySelector('.task-checkbox').addEventListener('click', () => toggleTask(task.id));
    item.querySelector('.task-label').addEventListener('click', () => toggleTask(task.id));
    item.querySelector('.task-delete-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      deleteTask(task.id);
    });

    dom.tasksList.appendChild(item);
  });
}

function toggleTask(id) {
  const task = state.tasks.find(t => t.id === id);
  if (task) {
    task.completed = !task.completed;
    saveState();
    renderTasks();
  }
}

function deleteTask(id) {
  state.tasks = state.tasks.filter(t => t.id !== id);
  saveState();
  renderTasks();
}

function addTask(name) {
  if (!name.trim()) return;
  state.tasks.push({
    id: Date.now().toString(),
    name: name.trim(),
    completed: false,
    date: getTodayStr(),
  });
  saveState();
  renderTasks();
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(str));
  return d.innerHTML;
}

/* ════════════════════════════════════════════════
   MOTIVATIONAL QUOTES
════════════════════════════════════════════════ */

function pickQuote() {
  let idx;
  do {
    idx = Math.floor(Math.random() * QUOTES.length);
  } while (idx === state.lastQuoteIndex && QUOTES.length > 1);
  state.lastQuoteIndex = idx;
  state.currentQuoteIndex = idx;
  return QUOTES[idx];
}

function showQuote() {
  dom.quote.style.opacity = '0';
  setTimeout(() => {
    dom.quote.textContent = `"${pickQuote()}"`;
    dom.quote.style.opacity = '1';
  }, 400);
}

function changeQuote() {
  showQuote();
}

/* ════════════════════════════════════════════════
   SETTINGS UI
════════════════════════════════════════════════ */

function openSettings() {
  syncSettingsUI();
  dom.settingsPanel.classList.remove('hidden');
  state.settingsOpen = true;
}

function closeSettings() {
  dom.settingsPanel.classList.add('hidden');
  state.settingsOpen = false;
}

function syncSettingsUI() {
  // Focus duration
  const focusOptions = Array.from(dom.settingsFocusDur.options).map(o => parseInt(o.value));
  if (focusOptions.includes(state.focusDuration)) {
    dom.settingsFocusDur.value = state.focusDuration;
    dom.settingsFocusCustom.classList.add('hidden');
  } else {
    dom.settingsFocusDur.value = 'custom';
    dom.settingsFocusCustom.classList.remove('hidden');
    dom.settingsFocusCustom.value = state.focusDuration;
  }

  // Break duration
  const breakOptions = Array.from(dom.settingsBreakDur.options).map(o => parseInt(o.value));
  if (breakOptions.includes(state.breakDuration)) {
    dom.settingsBreakDur.value = state.breakDuration;
    dom.settingsBreakCustom.classList.add('hidden');
  } else {
    dom.settingsBreakDur.value = 'custom';
    dom.settingsBreakCustom.classList.remove('hidden');
    dom.settingsBreakCustom.value = state.breakDuration;
  }

  // Long break duration
  const lbOptions = Array.from(dom.settingsLongBreakDur.options).map(o => parseInt(o.value));
  if (lbOptions.includes(state.longBreakDuration)) {
    dom.settingsLongBreakDur.value = state.longBreakDuration;
    dom.settingsLongBreakCustom.classList.add('hidden');
  } else {
    dom.settingsLongBreakDur.value = 'custom';
    dom.settingsLongBreakCustom.classList.remove('hidden');
    dom.settingsLongBreakCustom.value = state.longBreakDuration;
  }

  dom.settingsSessions.value = state.sessionsBeforeLongBreak;
  dom.settingsAutostartFocus.checked = state.autostartFocus;
  dom.settingsAutostartBreak.checked = state.autostartBreak;
  dom.settingsHideSeconds.checked = state.hideSeconds;
  dom.settingsSoundEffects.checked = state.soundEffects;
  dom.settingsAmbient.checked = state.ambientEnabled;
  dom.settingsVolume.value = state.volume;
  dom.settingsNotifications.checked = state.notifications;
}

function applySettings() {
  // Focus
  let focusVal = dom.settingsFocusDur.value;
  if (focusVal === 'custom') {
    focusVal = parseInt(dom.settingsFocusCustom.value) || 25;
  } else {
    focusVal = parseInt(focusVal);
  }
  state.focusDuration = Math.max(1, Math.min(180, focusVal));

  // Break
  let breakVal = dom.settingsBreakDur.value;
  if (breakVal === 'custom') {
    breakVal = parseInt(dom.settingsBreakCustom.value) || 5;
  } else {
    breakVal = parseInt(breakVal);
  }
  state.breakDuration = Math.max(1, Math.min(60, breakVal));

  // Long break
  let lbVal = dom.settingsLongBreakDur.value;
  if (lbVal === 'custom') {
    lbVal = parseInt(dom.settingsLongBreakCustom.value) || 15;
  } else {
    lbVal = parseInt(lbVal);
  }
  state.longBreakDuration = Math.max(1, Math.min(90, lbVal));

  state.sessionsBeforeLongBreak = parseInt(dom.settingsSessions.value) || 4;
  state.autostartFocus = dom.settingsAutostartFocus.checked;
  state.autostartBreak = dom.settingsAutostartBreak.checked;
  state.hideSeconds = dom.settingsHideSeconds.checked;
  state.soundEffects = dom.settingsSoundEffects.checked;
  state.ambientEnabled = dom.settingsAmbient.checked;
  state.volume = parseInt(dom.settingsVolume.value);
  state.notifications = dom.settingsNotifications.checked;

  // Sync toggles in menu
  dom.toggleSoundEffects.checked = state.soundEffects;
  dom.toggleAutostart.checked = state.autostartFocus && state.autostartBreak;
  dom.toggleHideSeconds.checked = state.hideSeconds;
  dom.toggleNotifications.checked = state.notifications;

  // Update audio volume
  dom.ambientAudio.volume = state.volume / 100;

  // Request notification permission if enabled
  if (state.notifications) {
    requestNotificationPermission();
  }

  // If ambient disabled, pause
  if (!state.ambientEnabled) {
    pauseAmbient();
  }

  updateMenuDurations();
  saveState();

  // Reset timer if not running to reflect new duration
  if (!state.timerRunning) {
    state.timerRemaining = 0;
    updateDisplay();
  }

  closeSettings();
  showToast('Settings saved');
}

function showToast(msg) {
  // Simple toast – reuse quote area briefly
  const prev = dom.quote.textContent;
  dom.quote.style.opacity = '0';
  setTimeout(() => {
    dom.quote.textContent = msg;
    dom.quote.style.opacity = '0.8';
    setTimeout(() => {
      dom.quote.style.opacity = '0';
      setTimeout(() => {
        dom.quote.textContent = prev;
        dom.quote.style.opacity = '1';
      }, 400);
    }, 1800);
  }, 300);
}

function updateMenuDurations() {
  dom.menuFocusDur.textContent = `${state.focusDuration} min`;
  dom.menuBreakDur.textContent = `${state.breakDuration} min`;
}

/* ════════════════════════════════════════════════
   THREE-DOT MENU
════════════════════════════════════════════════ */

function openMenu() {
  const btnRect = dom.threeDotBtn.getBoundingClientRect();
  const menu = dom.pomodoroMenu;
  menu.classList.remove('hidden');
  state.menuOpen = true;

  // Position menu
  const menuH = 320; // approx
  const menuW = 240;
  let top = btnRect.bottom + 8;
  let left = btnRect.left - menuW + 32;

  if (top + menuH > window.innerHeight) top = btnRect.top - menuH - 8;
  if (left < 8) left = 8;
  if (left + menuW > window.innerWidth) left = window.innerWidth - menuW - 8;

  menu.style.top = `${top}px`;
  menu.style.left = `${left}px`;

  // Sync menu state
  dom.toggleSoundEffects.checked = state.soundEffects;
  dom.toggleAutostart.checked = state.autostartFocus && state.autostartBreak;
  dom.toggleHideSeconds.checked = state.hideSeconds;
  dom.toggleNotifications.checked = state.notifications;
  updateMenuDurations();
}

function closeMenu() {
  dom.pomodoroMenu.classList.add('hidden');
  state.menuOpen = false;
}

/* ════════════════════════════════════════════════
   TOPIC INPUT
════════════════════════════════════════════════ */

function openTopicInput() {
  dom.topicInput.value = state.focusTopic;
  dom.topicInputOverlay.classList.remove('hidden');
  setTimeout(() => dom.topicInput.focus(), 50);
}

function closeTopicInput() {
  dom.topicInputOverlay.classList.add('hidden');
}

function saveTopic() {
  const val = dom.topicInput.value.trim();
  state.focusTopic = val;
  updateTopicDisplay();
  saveState();
  closeTopicInput();
}

function updateTopicDisplay() {
  if (state.focusTopic) {
    dom.topicText.textContent = state.focusTopic;
    dom.topicText.className = 'has-value';
  } else {
    dom.topicText.textContent = 'I will focus on...';
    dom.topicText.className = 'topic-placeholder';
  }
}

/* ════════════════════════════════════════════════
   EVENT LISTENERS
════════════════════════════════════════════════ */

function bindEvents() {
  // Play/Pause
  dom.playPauseBtn.addEventListener('click', () => {
    if (state.timerRunning) {
      pauseTimer();
    } else {
      // Initialize remaining if fresh start
      if (state.timerRemaining <= 0) {
        state.timerRemaining = getTotalDuration();
      }
      startTimer();
    }
  });

  // Stop focus from header button
  dom.stopFocusBtn.addEventListener('click', () => {
    exitFocusMode();
    resetTimer();
    switchMode('focus');
    hideCompletionNotification();
    hideBreakNotification();
  });

  // Mode tabs
  dom.focusTab.addEventListener('click', () => {
    if (state.mode === 'focus') return;
    if (state.timerRunning) pauseTimer();
    switchMode('focus');
  });

  dom.breakTab.addEventListener('click', () => {
    if (state.mode === 'break') return;
    if (state.timerRunning) pauseTimer();
    switchMode('break');
  });

  // Topic input
  dom.topicDisplay.addEventListener('click', openTopicInput);
  dom.topicInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveTopic();
    if (e.key === 'Escape') closeTopicInput();
  });
  dom.topicInputOverlay.addEventListener('click', (e) => {
    if (e.target === dom.topicInputOverlay) saveTopic();
  });

  // Three-dot menu
  dom.threeDotBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (state.menuOpen) closeMenu();
    else openMenu();
  });

  dom.menuComplete.addEventListener('click', () => {
    closeMenu();
    clearInterval(tickInterval);
    state.timerRunning = false;
    state.timerRemaining = 0;
    onTimerComplete();
  });

  dom.menuRestart.addEventListener('click', () => {
    closeMenu();
    const wasRunning = state.timerRunning;
    pauseTimer();
    state.timerRemaining = getTotalDuration();
    updateDisplay();
    if (wasRunning) startTimer();
  });

  dom.menuAdd5.addEventListener('click', () => { closeMenu(); addMinutes(5); });
  dom.menuAdd10.addEventListener('click', () => { closeMenu(); addMinutes(10); });

  // Duration controls in menu
  document.querySelectorAll('.dur-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.type;
      const action = btn.dataset.action;
      const step = 5;
      if (type === 'focus') {
        if (action === 'inc') state.focusDuration = Math.min(180, state.focusDuration + step);
        else state.focusDuration = Math.max(1, state.focusDuration - step);
        if (state.mode === 'focus' && !state.timerRunning) {
          state.timerRemaining = 0;
          updateDisplay();
        }
      } else {
        if (action === 'inc') state.breakDuration = Math.min(60, state.breakDuration + step);
        else state.breakDuration = Math.max(1, state.breakDuration - step);
        if (state.mode === 'break' && !state.timerRunning) {
          state.timerRemaining = 0;
          updateDisplay();
        }
      }
      updateMenuDurations();
      saveState();
    });
  });

  // Menu toggles
  dom.toggleSoundEffects.addEventListener('change', () => {
    state.soundEffects = dom.toggleSoundEffects.checked;
    saveState();
  });
  dom.toggleAutostart.addEventListener('change', () => {
    state.autostartFocus = dom.toggleAutostart.checked;
    state.autostartBreak = dom.toggleAutostart.checked;
    saveState();
  });
  dom.toggleHideSeconds.addEventListener('change', () => {
    state.hideSeconds = dom.toggleHideSeconds.checked;
    updateDisplay();
    saveState();
  });
  dom.toggleNotifications.addEventListener('change', () => {
    state.notifications = dom.toggleNotifications.checked;
    if (state.notifications) requestNotificationPermission();
    saveState();
  });

  // Close menu on outside click
  document.addEventListener('click', (e) => {
    if (state.menuOpen && !dom.pomodoroMenu.contains(e.target)) {
      closeMenu();
    }
  });

  // Tasks
  dom.addTaskBtn.addEventListener('click', () => {
    dom.addTaskForm.classList.remove('hidden');
    dom.addTaskBtn.closest('.add-task-row').style.display = 'none';
    dom.newTaskInput.focus();
  });

  dom.cancelTaskBtn.addEventListener('click', () => {
    dom.addTaskForm.classList.add('hidden');
    dom.addTaskBtn.closest('.add-task-row').style.display = '';
    dom.newTaskInput.value = '';
  });

  dom.saveTaskBtn.addEventListener('click', () => {
    addTask(dom.newTaskInput.value);
    dom.newTaskInput.value = '';
    dom.addTaskForm.classList.add('hidden');
    dom.addTaskBtn.closest('.add-task-row').style.display = '';
  });

  dom.newTaskInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      addTask(dom.newTaskInput.value);
      dom.newTaskInput.value = '';
      dom.addTaskForm.classList.add('hidden');
      dom.addTaskBtn.closest('.add-task-row').style.display = '';
    }
    if (e.key === 'Escape') {
      dom.addTaskForm.classList.add('hidden');
      dom.addTaskBtn.closest('.add-task-row').style.display = '';
      dom.newTaskInput.value = '';
    }
  });

  // Sound toggle
  dom.soundToggleBtn.addEventListener('click', () => {
    state.ambientEnabled = !state.ambientEnabled;
    if (state.ambientEnabled) {
      // Show volume slider
      dom.volumeSliderWrap.classList.remove('hidden');
      if (state.timerRunning && state.mode === 'focus') {
        playAmbient();
      }
    } else {
      dom.volumeSliderWrap.classList.add('hidden');
      pauseAmbient();
    }
    updateSoundIcon(state.ambientEnabled && !dom.ambientAudio.paused);
    saveState();
  });

  dom.volumeSlider.addEventListener('input', () => {
    state.volume = parseInt(dom.volumeSlider.value);
    dom.ambientAudio.volume = state.volume / 100;
    dom.settingsVolume.value = state.volume;
    saveState();
  });

  // Settings
  dom.settingsBtn.addEventListener('click', openSettings);
  dom.closeSettingsBtn.addEventListener('click', closeSettings);
  dom.settingsOverlay.addEventListener('click', closeSettings);
  dom.saveSettingsBtn.addEventListener('click', applySettings);

  // Custom duration selects
  dom.settingsFocusDur.addEventListener('change', () => {
    if (dom.settingsFocusDur.value === 'custom') {
      dom.settingsFocusCustom.classList.remove('hidden');
      dom.settingsFocusCustom.focus();
    } else {
      dom.settingsFocusCustom.classList.add('hidden');
    }
  });
  dom.settingsBreakDur.addEventListener('change', () => {
    if (dom.settingsBreakDur.value === 'custom') {
      dom.settingsBreakCustom.classList.remove('hidden');
      dom.settingsBreakCustom.focus();
    } else {
      dom.settingsBreakCustom.classList.add('hidden');
    }
  });
  dom.settingsLongBreakDur.addEventListener('change', () => {
    if (dom.settingsLongBreakDur.value === 'custom') {
      dom.settingsLongBreakCustom.classList.remove('hidden');
      dom.settingsLongBreakCustom.focus();
    } else {
      dom.settingsLongBreakCustom.classList.add('hidden');
    }
  });

  // Settings volume sync
  dom.settingsVolume.addEventListener('input', () => {
    state.volume = parseInt(dom.settingsVolume.value);
    dom.volumeSlider.value = state.volume;
    dom.ambientAudio.volume = state.volume / 100;
  });

  // Completion notification buttons
  dom.continueFocusBtn.addEventListener('click', () => {
    hideCompletionNotification();
    switchMode('break');
    startTimer();
  });

  dom.stopFocusModeBtn.addEventListener('click', () => {
    hideCompletionNotification();
    exitFocusMode();
    switchMode('focus');
  });

  dom.startFocusAgainBtn.addEventListener('click', () => {
    hideBreakNotification();
    switchMode('focus');
    startTimer();
  });

  dom.dismissBreakBtn.addEventListener('click', () => {
    hideBreakNotification();
    exitFocusMode();
    switchMode('focus');
  });

  // Fullscreen
  dom.fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (state.settingsOpen) return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (e.code === 'Space') {
      e.preventDefault();
      dom.playPauseBtn.click();
    }
    if (e.key === 'Escape') {
      if (state.menuOpen) closeMenu();
      if (state.focusModeActive) exitFocusMode();
    }
    if (e.key === 'f' || e.key === 'F') {
      dom.fullscreenBtn.click();
    }
  });

  // Handle page visibility (timer accuracy when tab hidden)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) return;
    // When returning, just update display — timestamps handle accuracy
    if (state.timerRunning) {
      updateDisplay();
    }
  });
}

/* ════════════════════════════════════════════════
   INITIALIZE
════════════════════════════════════════════════ */

function init() {
  // Load persisted state
  loadState();

  // Background
  initBackground();

  // Progress ring
  initRing();

  // Set initial timer display
  state.timerRemaining = getTotalDuration();
  updateDisplay(state.timerRemaining);

  // Restore topic
  updateTopicDisplay();

  // Volume
  dom.ambientAudio.volume = state.volume / 100;
  dom.volumeSlider.value = state.volume;

  // Sync menu toggles
  dom.toggleSoundEffects.checked = state.soundEffects;
  dom.toggleAutostart.checked = state.autostartFocus && state.autostartBreak;
  dom.toggleHideSeconds.checked = state.hideSeconds;
  dom.toggleNotifications.checked = state.notifications;
  updateMenuDurations();

  // Session count
  dom.sessionCountDisplay.textContent = `Session ${state.sessionCount}`;

  // Sound icon
  updateSoundIcon(false);

  // Volume slider wrap
  if (state.ambientEnabled) {
    dom.volumeSliderWrap.classList.remove('hidden');
  } else {
    dom.volumeSliderWrap.classList.add('hidden');
  }

  // Render tasks
  renderTasks();

  // Quote
  dom.quote.style.transition = 'opacity 0.5s ease';
  showQuote();

  // Bind events
  bindEvents();

  // Notification permission
  if (state.notifications && Notification.permission === 'default') {
    requestNotificationPermission();
  }
}

// Kick off
document.addEventListener('DOMContentLoaded', init);
