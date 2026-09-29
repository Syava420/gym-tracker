// Модуль таймера отдыха между подходами с Web Audio API (звук без файлов)

let timerInterval = null;
let remainingSeconds = 0;
let totalDuration = 0;
let onTickCallback = null;
let onCompleteCallback = null;

function playBeep(frequency = 880, duration = 0.25, count = 2) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    for (let i = 0; i < count; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.value = frequency;

      const startTime = ctx.currentTime + i * (duration + 0.1);
      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    }
  } catch (e) {
    console.warn("Аудио недоступно до взаимодействия:", e);
  }
}

function triggerVibrate() {
  if ("vibrate" in navigator) {
    try {
      navigator.vibrate([300, 150, 300]);
    } catch (e) {
      // Игнорируем
    }
  }
}

let timerEndTime = 0;

function sendTimerNotification(title, body) {
  try {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: "./icon-192.png"
      });
    }
  } catch (e) {}
}

function requestNotificationPermission() {
  try {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  } catch (e) {}
}

function startRestTimer(seconds, onTick, onComplete) {
  stopRestTimer();
  requestNotificationPermission();

  remainingSeconds = seconds;
  totalDuration = seconds;
  timerEndTime = Date.now() + seconds * 1000;
  onTickCallback = onTick;
  onCompleteCallback = onComplete;

  if (onTickCallback) {
    onTickCallback(remainingSeconds, totalDuration);
  }

  const tick = () => {
    const now = Date.now();
    remainingSeconds = Math.max(0, Math.round((timerEndTime - now) / 1000));

    if (onTickCallback) {
      onTickCallback(remainingSeconds, totalDuration);
    }

    if (remainingSeconds <= 0) {
      stopRestTimer();
      playBeep(920, 0.3, 3);
      triggerVibrate();
      sendTimerNotification("Отдых завершен!", "Пора приступать к следующему подходу");
      if (onCompleteCallback) {
        onCompleteCallback();
      }
    }
  };

  timerInterval = setInterval(tick, 500);
}

// При возврате из YouTube или разблокировке экрана моментально синхронизируем время
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && timerInterval !== null) {
    const now = Date.now();
    remainingSeconds = Math.max(0, Math.round((timerEndTime - now) / 1000));
    if (onTickCallback) {
      onTickCallback(remainingSeconds, totalDuration);
    }
    if (remainingSeconds <= 0) {
      stopRestTimer();
      playBeep(920, 0.3, 3);
      triggerVibrate();
      if (onCompleteCallback) {
        onCompleteCallback();
      }
    }
  }
});

function stopRestTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  remainingSeconds = 0;
  timerEndTime = 0;
}

function addTimerSeconds(extra = 30) {
  timerEndTime += extra * 1000;
  totalDuration += extra;
  const now = Date.now();
  remainingSeconds = Math.max(0, Math.round((timerEndTime - now) / 1000));
  if (onTickCallback) {
    onTickCallback(remainingSeconds, totalDuration);
  }
}

function formatTime(seconds) {
  const sec = parseInt(seconds, 10);
  if (isNaN(sec) || sec <= 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

function isTimerRunning() {
  return timerInterval !== null;
}

window.TimerModule = {
  startRestTimer,
  stopRestTimer,
  addTimerSeconds,
  formatTime,
  isTimerRunning
};
