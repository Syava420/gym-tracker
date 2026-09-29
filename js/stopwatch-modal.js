// Модуль красивого круглого таймера для статических упражнений (вис на турнике, планка и т.д.)

let prepTimerInterval = null;
let runTimerInterval = null;
let elapsedSeconds = 0;
let prepCount = 3;

// Звуковой генератор
function playSound(freq = 600, duration = 0.15) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {}
}

/**
 * Открыть круглый таймер для виса/планки с подготовкой и автосохранением результата
 */
function openStaticTimerModal({ title, targetSeconds = 40, onSaveTime }) {
  let modal = document.getElementById("static-timer-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "static-timer-modal";
    modal.className = "modal-overlay";
    document.body.appendChild(modal);
  }

  elapsedSeconds = 0;
  prepCount = 3;
  clearInterval(prepTimerInterval);
  clearInterval(runTimerInterval);

  modal.innerHTML = `
    <div class="modal-card static-timer-card">
      <div class="modal-header">
        <span class="modal-title">${title || "Таймер упражнения"}</span>
        <button type="button" class="modal-close" id="st-close-btn">✕</button>
      </div>

      <div class="static-timer-body">
        <!-- Блок подготовки (3... 2... 1... СТАРТ!) -->
        <div class="prep-countdown-box" id="st-prep-box">
          <div class="prep-hint-text">Приготовься подойти к снаряду:</div>
          <div class="prep-num" id="st-prep-num">3</div>
          <button type="button" class="btn-skip-prep" id="st-skip-prep">Пропустить подготовку →</button>
        </div>

        <!-- Круговой таймер (показывается после подготовки) -->
        <div class="running-timer-box hidden" id="st-running-box">
          <div class="circular-timer-container">
            <svg class="circular-timer-svg" viewBox="0 0 200 200">
              <circle class="circle-bg" cx="100" cy="100" r="85"></circle>
              <circle class="circle-progress" id="st-circle-progress" cx="100" cy="100" r="85"></circle>
            </svg>
            <div class="circle-inner-content">
              <div class="circle-time-digits" id="st-time-digits">00:00</div>
              <div class="circle-target-label">Цель: ${targetSeconds} сек</div>
            </div>
          </div>

          <div class="static-timer-actions">
            <button type="button" class="btn-stop-hang" id="st-btn-stop">СПРЫГНУЛ / СТОП</button>
          </div>
        </div>
      </div>
    </div>
  `;

  modal.classList.add("visible");

  const prepBox = modal.querySelector("#st-prep-box");
  const runningBox = modal.querySelector("#st-running-box");
  const prepNumEl = modal.querySelector("#st-prep-num");
  const digitsEl = modal.querySelector("#st-time-digits");
  const circleProgress = modal.querySelector("#st-circle-progress");

  const circleRadius = 85;
  const circumference = 2 * Math.PI * circleRadius;
  circleProgress.style.strokeDasharray = `${circumference}`;
  circleProgress.style.strokeDashoffset = `${circumference}`;

  function cleanUp() {
    clearInterval(prepTimerInterval);
    clearInterval(runTimerInterval);
    modal.classList.remove("visible");
  }

  modal.querySelector("#st-close-btn").addEventListener("click", cleanUp);

  let staticStartTime = 0;

  function startRunningPhase() {
    clearInterval(prepTimerInterval);
    prepBox.classList.add("hidden");
    runningBox.classList.remove("hidden");

    playSound(880, 0.3); // Высокий звук старта

    staticStartTime = Date.now();
    elapsedSeconds = 0;
    digitsEl.textContent = "00:00";

    const tick = () => {
      elapsedSeconds = Math.max(0, Math.floor((Date.now() - staticStartTime) / 1000));
      const m = Math.floor(elapsedSeconds / 60);
      const s = elapsedSeconds % 60;
      digitsEl.textContent = `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;

      // Обновление круговой шкалы
      const progress = Math.min(1, elapsedSeconds / targetSeconds);
      const offset = circumference - progress * circumference;
      circleProgress.style.strokeDashoffset = `${offset}`;

      // Звуковой сигнал при достижении цели
      if (elapsedSeconds >= targetSeconds && !digitsEl.classList.contains("target-hit")) {
        playSound(950, 0.4);
        digitsEl.classList.add("target-hit");
      }
    };

    runTimerInterval = setInterval(tick, 500);
  }

  // Запуск 3-секундного отсчета подготовки
  playSound(440, 0.15);
  prepTimerInterval = setInterval(() => {
    prepCount--;
    if (prepCount > 0) {
      prepNumEl.textContent = prepCount;
      playSound(440, 0.15);
    } else {
      startRunningPhase();
    }
  }, 1000);

  modal.querySelector("#st-skip-prep").addEventListener("click", () => {
    startRunningPhase();
  });

  // Кнопка "Спрыгнул / Стоп" - сохраняет результат
  modal.querySelector("#st-btn-stop").addEventListener("click", () => {
    clearInterval(runTimerInterval);
    const finalSec = elapsedSeconds;
    cleanUp();
    if (onSaveTime) {
      onSaveTime(finalSec);
    }
  });
}

/**
 * Открыть секундомер/таймер для кардио (бег на дорожке, эллипс, интервалы)
 * «Нажал и побежал» с поддержкой сворачивания и работы в фоне YouTube
 */
function openCardioTimerModal({
  title = "Кардио",
  targetSeconds = 0,
  mode = "distance",
  distanceKm = null,
  distance = null,
  distUnit = "km",
  timeUnit = "min",
  incline = null,
  level = null,
  bikeLevel = null,
  defaultTimeStr = "",
  onSaveTime
}) {
  let modal = document.getElementById("cardio-timer-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "cardio-timer-modal";
    modal.className = "modal-overlay";
    document.body.appendChild(modal);
  }

  let targetSec = targetSeconds;
  if (!targetSec && defaultTimeStr) {
    if (defaultTimeStr.includes(":")) {
      const parts = defaultTimeStr.split(":");
      const m = parseInt(parts[0], 10) || 0;
      const s = parseInt(parts[1], 10) || 0;
      targetSec = m * 60 + s;
    } else if (defaultTimeStr.toLowerCase().includes("ч") || defaultTimeStr.toLowerCase().includes("час")) {
      targetSec = Math.round((parseFloat(defaultTimeStr) || 0) * 3600);
    } else if (defaultTimeStr.toLowerCase().includes("мин")) {
      targetSec = (parseInt(defaultTimeStr, 10) || 0) * 60;
    } else if (defaultTimeStr.toLowerCase().includes("сек") || defaultTimeStr.toLowerCase().includes("с")) {
      targetSec = parseInt(defaultTimeStr, 10) || 0;
    } else {
      targetSec = parseInt(defaultTimeStr, 10) || 0;
    }
  }

  let isPaused = false;
  let cardioStartTime = 0;
  let accumulatedPauseMs = 0;
  let pauseStartedAt = 0;
  let cardioElapsed = 0;
  let cardioTimerInterval = null;
  let prepTimer = null;
  let prepSec = 3;
  let isTargetHitAlerted = false;

  const metaBadges = [];
  if (distance != null) {
    metaBadges.push(distUnit === "m" ? `${distance} м` : `${distance} км`);
  } else if (distanceKm != null) {
    metaBadges.push(`${distanceKm} км`);
  }
  if (incline !== null && incline !== undefined && incline > 0) metaBadges.push(`Уклон: ${incline}%`);
  if (level !== null && level !== undefined) metaBadges.push(`Тяжесть / Уровень: ${level}`);
  if (bikeLevel !== null && bikeLevel !== undefined) metaBadges.push(`Нагрузка: ${bikeLevel}`);
  if (mode === "time" && targetSec > 0) {
    if (timeUnit === "sec") {
      metaBadges.push(`Цель: ${targetSec} сек`);
    } else if (timeUnit === "hour") {
      metaBadges.push(`Цель: ${Math.round((targetSec / 3600) * 100) / 100} ч`);
    } else {
      metaBadges.push(`Цель: ${Math.round(targetSec / 60)} мин`);
    }
  }

  modal.innerHTML = `
    <div class="modal-card static-timer-card cardio-timer-card">
      <div class="modal-header">
        <div style="text-align: left;">
          <span class="modal-title">${title}</span>
          ${metaBadges.length > 0 ? `<div class="cardio-timer-meta-strip">${metaBadges.join(" • ")}</div>` : ""}
        </div>
        <div class="modal-header-actions">
          <button type="button" class="btn-timer-minimize" id="ct-min-btn" title="Свернуть в мини-строку">_ Свернуть</button>
          <button type="button" class="modal-close" id="ct-close-btn">✕</button>
        </div>
      </div>

      <div class="static-timer-body">
        <div class="prep-countdown-box" id="ct-prep-box">
          <div class="prep-hint-text">Приготовься к старту:</div>
          <div class="prep-num" id="ct-prep-num">3</div>
          <button type="button" class="btn-skip-prep" id="ct-skip-prep">Старт прямо сейчас →</button>
        </div>

        <div class="running-timer-box hidden" id="ct-running-box">
          <div class="circular-timer-container">
            <svg class="circular-timer-svg" viewBox="0 0 200 200">
              <circle class="circle-bg" cx="100" cy="100" r="85"></circle>
              <circle class="circle-progress cardio-circle" id="ct-circle-progress" cx="100" cy="100" r="85"></circle>
            </svg>
            <div class="circle-inner-content">
              <div class="circle-time-digits" id="ct-time-digits">00:00</div>
              <div class="circle-target-label" id="ct-target-label">
                ${targetSec > 0 ? `Цель: ${formatCardioTime(targetSec)}` : "Секундомер"}
              </div>
            </div>
          </div>

          <div class="cardio-timer-btn-row">
            <button type="button" class="btn-cardio-pause" id="ct-btn-pause">Пауза</button>
            <button type="button" class="btn-stop-hang btn-cardio-finish" id="ct-btn-finish">ЗАВЕРШИТЬ</button>
          </div>
        </div>
      </div>
    </div>
  `;

  modal.classList.add("visible");
  modal.classList.remove("hidden");

  const prepBox = modal.querySelector("#ct-prep-box");
  const runningBox = modal.querySelector("#ct-running-box");
  const prepNumEl = modal.querySelector("#ct-prep-num");
  const digitsEl = modal.querySelector("#ct-time-digits");
  const circleProgress = modal.querySelector("#ct-circle-progress");
  const btnPause = modal.querySelector("#ct-btn-pause");
  const btnFinish = modal.querySelector("#ct-btn-finish");
  const btnMin = modal.querySelector("#ct-min-btn");

  const circleRadius = 85;
  const circumference = 2 * Math.PI * circleRadius;
  circleProgress.style.strokeDasharray = `${circumference}`;
  circleProgress.style.strokeDashoffset = `${circumference}`;

  // Получаем плавающий мини-бар строго внутри экрана приложения
  const appContainer = document.getElementById("app-container") || document.querySelector(".app-container");
  let miniBar = document.getElementById("cardio-floating-bar");
  if (!miniBar) {
    miniBar = document.createElement("div");
    miniBar.id = "cardio-floating-bar";
    miniBar.className = "cardio-floating-bar hidden";
    if (appContainer) {
      appContainer.appendChild(miniBar);
    } else {
      document.body.appendChild(miniBar);
    }
  } else if (appContainer && miniBar.parentElement !== appContainer) {
    appContainer.appendChild(miniBar);
  }

  function cleanUp() {
    clearInterval(prepTimer);
    clearInterval(cardioTimerInterval);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    modal.classList.remove("visible");
    modal.classList.remove("hidden");
    if (miniBar) miniBar.classList.add("hidden");
    document.title = "Hyper-Mass | Gym Tracker";
  }

  modal.querySelector("#ct-close-btn").addEventListener("click", cleanUp);

  function formatCardioTime(sec) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) {
      return `${h}:${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
    }
    return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  }

  function getActualElapsed() {
    if (!cardioStartTime) return 0;
    if (isPaused) {
      return Math.max(0, Math.floor((pauseStartedAt - cardioStartTime - accumulatedPauseMs) / 1000));
    }
    return Math.max(0, Math.floor((Date.now() - cardioStartTime - accumulatedPauseMs) / 1000));
  }

  function updateTimerDisplays() {
    cardioElapsed = getActualElapsed();
    const formatted = formatCardioTime(cardioElapsed);
    digitsEl.textContent = formatted;

    const miniTimeEl = miniBar.querySelector("#cfb-time-digits");
    if (miniTimeEl) miniTimeEl.textContent = formatted;

    document.title = `${formatted} | ${title}`;

    if (targetSec > 0) {
      const progress = Math.min(1, cardioElapsed / targetSec);
      const offset = circumference - progress * circumference;
      circleProgress.style.strokeDashoffset = `${offset}`;

      if (cardioElapsed >= targetSec && !isTargetHitAlerted) {
        isTargetHitAlerted = true;
        playSound(950, 0.5);
        digitsEl.classList.add("target-hit");
        try {
          if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
        } catch (e) {}

        // Отправка системного уведомления, если пользователь в YouTube
        if (document.hidden && "Notification" in window && Notification.permission === "granted") {
          new Notification("Время вышло!", {
            body: `Цель достигнута: ${title} (${formatCardioTime(targetSec)})`,
            icon: "./icon-192.png"
          });
        }
      }
    }
  }

  function onVisibilityChange() {
    if (!document.hidden && cardioStartTime > 0) {
      updateTimerDisplays();
    }
  }
  document.addEventListener("visibilitychange", onVisibilityChange);

  function startRunning() {
    clearInterval(prepTimer);
    prepBox.classList.add("hidden");
    runningBox.classList.remove("hidden");

    playSound(880, 0.25);
    try {
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    } catch (e) {}

    cardioStartTime = Date.now();
    accumulatedPauseMs = 0;
    cardioElapsed = 0;
    digitsEl.textContent = "00:00";

    cardioTimerInterval = setInterval(() => {
      if (!isPaused) {
        updateTimerDisplays();
      }
    }, 500);
  }

  // Обратный отсчет подготовки (3..2..1)
  playSound(440, 0.12);
  prepTimer = setInterval(() => {
    prepSec--;
    if (prepSec > 0) {
      prepNumEl.textContent = prepSec;
      playSound(440, 0.12);
    } else {
      startRunning();
    }
  }, 1000);

  modal.querySelector("#ct-skip-prep").addEventListener("click", () => {
    startRunning();
  });

  // Кнопка сворачивания в мини-бар
  btnMin.addEventListener("click", () => {
    if (prepTimer) {
      startRunning();
    }
    modal.classList.remove("visible");
    miniBar.innerHTML = `
      <div class="cfb-left" id="cfb-expand-click">
        <span class="cfb-pulse"></span>
        <span class="cfb-time" id="cfb-time-digits">${digitsEl.textContent}</span>
        <span class="cfb-title">${title}</span>
      </div>
      <div class="cfb-actions">
        <button type="button" class="btn-cfb-expand" id="cfb-expand-btn">Развернуть</button>
        <button type="button" class="btn-cfb-finish" id="cfb-finish-btn">Готово</button>
      </div>
    `;
    miniBar.classList.remove("hidden");

    miniBar.querySelector("#cfb-expand-click").addEventListener("click", () => {
      miniBar.classList.add("hidden");
      modal.classList.add("visible");
    });
    miniBar.querySelector("#cfb-expand-btn").addEventListener("click", () => {
      miniBar.classList.add("hidden");
      modal.classList.add("visible");
    });
    miniBar.querySelector("#cfb-finish-btn").addEventListener("click", () => {
      finishCardio();
    });
  });

  btnPause.addEventListener("click", () => {
    isPaused = !isPaused;
    if (isPaused) {
      pauseStartedAt = Date.now();
    } else {
      accumulatedPauseMs += (Date.now() - pauseStartedAt);
    }
    btnPause.textContent = isPaused ? "Продолжить" : "Пауза";
    btnPause.classList.toggle("paused", isPaused);
  });

  function finishCardio() {
    clearInterval(cardioTimerInterval);
    const finalSec = getActualElapsed();
    const timeFormatted = formatCardioTime(finalSec);
    cleanUp();

    playSound(1050, 0.3);
    try {
      if (navigator.vibrate) navigator.vibrate([150, 50, 150]);
    } catch (e) {}

    if (onSaveTime) {
      onSaveTime(finalSec, timeFormatted);
    }
  }

  btnFinish.addEventListener("click", finishCardio);
}

window.StopwatchModal = {
  openStaticTimerModal,
  openCardioTimerModal
};


