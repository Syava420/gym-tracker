// cardio-helper.js
// Модуль работы с кардио-упражнениями (беговая дорожка, эллипс, велотренажер)
// Поддерживает:
// 1. Уклон (%) для беговой дорожки
// 2. Уровень тяжести/сопротивления (Lvl) для эллипса
// 3. Выбор режима: «По дистанции» vs «По времени»
// 4. Секундомер / таймер отрезка «Нажал и побежал» (⏱️)

function isCardioExercise(ex) {
  if (!ex) return false;
  return Boolean(
    ex.isCardio ||
    ex.category === "Бег" ||
    ex.category === "Эллипс" ||
    (ex.name && (
      ex.name.toLowerCase().includes("бег") ||
      ex.name.toLowerCase().includes("дорожк") ||
      ex.name.toLowerCase().includes("эллипс") ||
      ex.name.toLowerCase().includes("интервал") ||
      ex.name.toLowerCase().includes("спринт") ||
      ex.name.toLowerCase().includes("кросс")
    ))
  );
}

function getCardioType(ex) {
  if (!ex) return "treadmill";
  if (ex.cardioType) return ex.cardioType;
  const name = (ex.name || "").toLowerCase();
  const cat = (ex.category || "").toLowerCase();
  const equip = (ex.equip || "").toLowerCase();
  if (cat.includes("эллипс") || name.includes("эллипс") || equip.includes("эллипс") || name.includes("вело")) {
    return "ellipse";
  }
  return "treadmill";
}

/**
 * Рендерит плашку переключения режима (Дистанция / Время) и быстрого изменения уклона/тяжести
 */
function renderCardioControls(container, ex, workout, onSaveSession, onRerender) {
  const isEllipse = getCardioType(ex) === "ellipse";
  const mode = ex.cardioMode || "distance"; // 'distance' | 'time'

  const bar = document.createElement("div");
  bar.className = "cardio-control-bar";

  bar.innerHTML = `
    <div class="cardio-mode-toggle">
      <button type="button" class="btn-cardio-mode ${mode === 'distance' ? 'active' : ''}" data-mode="distance">Дистанция</button>
      <button type="button" class="btn-cardio-mode ${mode === 'time' ? 'active' : ''}" data-mode="time">По времени</button>
    </div>

    ${mode === 'distance' ? `
      <div class="cardio-param-box">
        <span class="cpb-label">${isEllipse ? "Тяжесть:" : "Уклон:"}</span>
        <div class="cpb-stepper">
          <button type="button" class="btn-cqp-step btn-cqp-dec" title="Уменьшить">-</button>
          <span class="cqp-val" id="cqp-val-param">${isEllipse ? (ex.resistanceLevel !== undefined ? ex.resistanceLevel : 5) : (ex.incline !== undefined ? ex.incline : 1) + '%'}</span>
          <button type="button" class="btn-cqp-step btn-cqp-inc" title="Увеличить">+</button>
        </div>
      </div>
    ` : ""}
  `;

  // Переключение режимов: Дистанция vs Время
  bar.querySelectorAll(".btn-cardio-mode").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const targetMode = btn.dataset.mode;
      if (ex.cardioMode !== targetMode) {
        ex.cardioMode = targetMode;
        if (targetMode === "time" && (!ex.targetMinutes || ex.targetMinutes <= 0)) {
          ex.targetMinutes = 20;
        }
        onSaveSession();
        onRerender();
      }
    });
  });

  // Изменение уклона или уровня тяжести (в режиме дистанции)
  if (mode === "distance") {
    const decBtn = bar.querySelector(".btn-cqp-dec");
    const incBtn = bar.querySelector(".btn-cqp-inc");
    const valSpan = bar.querySelector("#cqp-val-param");

    if (decBtn && incBtn && valSpan) {
      if (isEllipse) {
        decBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          let current = ex.resistanceLevel !== undefined ? ex.resistanceLevel : 5;
          ex.resistanceLevel = Math.max(1, current - 1);
          valSpan.textContent = `${ex.resistanceLevel}`;
          onSaveSession();
        });

        incBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          let current = ex.resistanceLevel !== undefined ? ex.resistanceLevel : 5;
          ex.resistanceLevel = Math.min(25, current + 1);
          valSpan.textContent = `${ex.resistanceLevel}`;
          onSaveSession();
        });
      } else {
        decBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          let current = ex.incline !== undefined ? ex.incline : 1;
          ex.incline = Math.max(0, Math.round((current - 0.5) * 10) / 10);
          valSpan.textContent = `${ex.incline}%`;
          onSaveSession();
        });

        incBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          let current = ex.incline !== undefined ? ex.incline : 1;
          ex.incline = Math.min(20, Math.round((current + 0.5) * 10) / 10);
          valSpan.textContent = `${ex.incline}%`;
          onSaveSession();
        });
      }
    }
  }

  container.appendChild(bar);
}

/**
 * Рендер строки кардио-подхода (отрезка)
 * Поддерживает оба режима:
 * - По дистанции: отрезок | пред | дист (км) | время/темп + ⏱️ | ✓ | ✕
 * - По времени: отрезок | пред | время (мин) + ⏱️ | уклон % или Lvl тяжесть | ✓ | ✕
 */
function renderCardioSetRow(row, set, setIndex, ex, workout, onSaveSession, onTriggerRest, onRerender, onStartTimer, sessionStartTime) {
  const isEllipse = getCardioType(ex) === "ellipse";
  const mode = ex.cardioMode || "distance";

  // SVG-иконка секундомера
  const stopwatchIcon = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M10 2h4"/></svg>`;

  if (mode === "time") {
    // РЕЖИМ 2: ПО ВРЕМЕНИ
    let mins = set.minutes;
    if (!mins) {
      const parsed = parseInt(set.time);
      mins = (!isNaN(parsed) && parsed > 0) ? parsed : (ex.targetMinutes || 20);
      set.minutes = mins;
    }
    const paramVal = isEllipse 
      ? (set.level != null ? set.level : (ex.resistanceLevel || 5))
      : (set.incline != null ? set.incline : (ex.incline || 1));

    row.innerHTML = `
      <div class="set-num-cell">
        <span class="set-index-badge run">${set.setNumber}</span>
      </div>
      <div class="set-prev-cell">${set.prevInfo || "—"}</div>

      <div class="set-stepper-cell cardio-time-mode-cell">
        <button type="button" class="btn-step btn-dec-min">-</button>
        <input type="number" min="1" max="180" class="step-input input-minutes" value="${mins}">
        <button type="button" class="btn-step btn-inc-min">+</button>
        <button type="button" class="btn-open-cardio-timer" title="Нажал и побежал (запустить таймер)">${stopwatchIcon}</button>
      </div>

      <div class="set-stepper-cell cardio-param-mode-cell">
        <button type="button" class="btn-step btn-dec-param">-</button>
        <input type="number" class="step-input input-cardio-set-param" value="${paramVal}" step="${isEllipse ? 1 : 0.5}">
        <button type="button" class="btn-step btn-inc-param">+</button>
      </div>

      <div class="set-check-cell">
        <button type="button" class="btn-complete-set ${set.completed ? "active" : ""}">✓</button>
      </div>

      <div class="set-del-cell">
        <button type="button" class="btn-del-set-btn" title="Удалить подход">✕</button>
      </div>
    `;

    const inputMin = row.querySelector(".input-minutes");
    const inputParam = row.querySelector(".input-cardio-set-param");
    const btnCheck = row.querySelector(".btn-complete-set");
    const timerBtn = row.querySelector(".btn-open-cardio-timer");

    // Степер минут
    row.querySelector(".btn-dec-min").addEventListener("click", (e) => {
      e.stopPropagation();
      set.minutes = Math.max(1, (set.minutes || 20) - (set.minutes > 5 ? 5 : 1));
      inputMin.value = set.minutes;
      set.time = `${set.minutes} мин`;
      onSaveSession();
    });

    row.querySelector(".btn-inc-min").addEventListener("click", (e) => {
      e.stopPropagation();
      set.minutes = (set.minutes || 20) + 5;
      inputMin.value = set.minutes;
      set.time = `${set.minutes} мин`;
      onSaveSession();
    });

    inputMin.addEventListener("change", () => {
      const val = parseInt(inputMin.value);
      set.minutes = isNaN(val) || val <= 0 ? 20 : val;
      set.time = `${set.minutes} мин`;
      onSaveSession();
    });

    // Степер параметра (уклон или тяжесть)
    row.querySelector(".btn-dec-param").addEventListener("click", (e) => {
      e.stopPropagation();
      if (isEllipse) {
        set.level = Math.max(1, (set.level != null ? set.level : (ex.resistanceLevel || 5)) - 1);
        inputParam.value = set.level;
      } else {
        const cur = set.incline != null ? set.incline : (ex.incline || 1);
        set.incline = Math.max(0, Math.round((cur - 0.5) * 10) / 10);
        inputParam.value = set.incline;
      }
      onSaveSession();
    });

    row.querySelector(".btn-inc-param").addEventListener("click", (e) => {
      e.stopPropagation();
      if (isEllipse) {
        set.level = Math.min(25, (set.level != null ? set.level : (ex.resistanceLevel || 5)) + 1);
        inputParam.value = set.level;
      } else {
        const cur = set.incline != null ? set.incline : (ex.incline || 1);
        set.incline = Math.min(20, Math.round((cur + 0.5) * 10) / 10);
        inputParam.value = set.incline;
      }
      onSaveSession();
    });

    inputParam.addEventListener("change", () => {
      const val = parseFloat(inputParam.value);
      if (isEllipse) {
        set.level = isNaN(val) ? 5 : Math.max(1, Math.round(val));
      } else {
        set.incline = isNaN(val) ? 1 : Math.max(0, val);
      }
      onSaveSession();
    });

    // «Нажал и побежал»
    timerBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const currentMin = set.minutes || 20;
      window.StopwatchModal.openCardioTimerModal({
        title: ex.name,
        targetSeconds: currentMin * 60,
        mode: "time",
        incline: !isEllipse ? (set.incline != null ? set.incline : ex.incline) : null,
        level: isEllipse ? (set.level != null ? set.level : ex.resistanceLevel) : null,
        defaultTimeStr: `${currentMin} мин`,
        onSaveTime: (finalSec, timeFormatted) => {
          const actualMins = Math.max(1, Math.round(finalSec / 60));
          set.minutes = actualMins;
          set.time = `${actualMins} мин`;
          inputMin.value = actualMins;
          set.completed = true;
          set.completedAt = Date.now();
          btnCheck.classList.add("active");
          row.classList.add("done");

          if (!sessionStartTime && onStartTimer) {
            onStartTimer(Date.now());
          }
          onSaveSession();
          if (ex.restSeconds > 0) onTriggerRest(ex.restSeconds);
        }
      });
    });

    btnCheck.addEventListener("click", (e) => {
      e.stopPropagation();
      set.completed = !set.completed;
      if (set.completed) {
        set.completedAt = Date.now();
        if (!sessionStartTime && onStartTimer) onStartTimer(Date.now());
      } else {
        delete set.completedAt;
      }
      btnCheck.classList.toggle("active", set.completed);
      row.classList.toggle("done", set.completed);
      onSaveSession();

      if (set.completed && ex.restSeconds > 0) {
        onTriggerRest(ex.restSeconds);
      }
    });

  } else {
    // РЕЖИМ 1: ПО ДИСТАНЦИИ (по умолчанию)
    const dist = set.distance !== undefined ? set.distance : (ex.defaultDistance || 0.4);
    const time = set.time || set.reps || ex.defaultPace || "04:20";

    row.innerHTML = `
      <div class="set-num-cell">
        <span class="set-index-badge run">${set.setNumber}</span>
      </div>
      <div class="set-prev-cell">${set.prevInfo || "—"}</div>
      
      <div class="set-stepper-cell cardio-stepper">
        <button type="button" class="btn-step btn-dec-dist">-</button>
        <input type="number" step="0.1" min="0.05" class="step-input input-distance" value="${dist}">
        <button type="button" class="btn-step btn-inc-dist">+</button>
      </div>

      <div class="set-stepper-cell cardio-time-cell">
        <input type="text" class="step-input input-time" value="${time}" placeholder="4:20">
        <button type="button" class="btn-open-cardio-timer" title="Нажал и побежал (запустить секундомер отрезка)">${stopwatchIcon}</button>
      </div>

      <div class="set-check-cell">
        <button type="button" class="btn-complete-set ${set.completed ? "active" : ""}">✓</button>
      </div>

      <div class="set-del-cell">
        <button type="button" class="btn-del-set-btn" title="Удалить отрезок">✕</button>
      </div>
    `;

    const inputDist = row.querySelector(".input-distance");
    const inputTime = row.querySelector(".input-time");
    const btnCheck = row.querySelector(".btn-complete-set");
    const timerBtn = row.querySelector(".btn-open-cardio-timer");

    row.querySelector(".btn-dec-dist").addEventListener("click", (e) => {
      e.stopPropagation();
      let current = parseFloat(set.distance) || 0.4;
      set.distance = Math.max(0.05, Math.round((current - 0.1) * 10) / 10);
      inputDist.value = set.distance;
      onSaveSession();
    });

    row.querySelector(".btn-inc-dist").addEventListener("click", (e) => {
      e.stopPropagation();
      let current = parseFloat(set.distance) || 0.4;
      set.distance = Math.round((current + 0.1) * 10) / 10;
      inputDist.value = set.distance;
      onSaveSession();
    });

    inputDist.addEventListener("change", () => {
      const val = parseFloat(inputDist.value);
      set.distance = isNaN(val) ? 0.4 : val;
      onSaveSession();
    });

    inputTime.addEventListener("change", () => {
      set.time = inputTime.value.trim() || "04:20";
      onSaveSession();
    });

    // «Нажал и побежал»
    timerBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const currentDist = set.distance || 0.4;
      window.StopwatchModal.openCardioTimerModal({
        title: ex.name,
        mode: "distance",
        distanceKm: currentDist,
        incline: !isEllipse ? (set.incline != null ? set.incline : ex.incline) : null,
        level: isEllipse ? (set.level != null ? set.level : ex.resistanceLevel) : null,
        defaultTimeStr: set.time || "04:20",
        onSaveTime: (finalSec, timeFormatted) => {
          set.time = timeFormatted;
          inputTime.value = timeFormatted;
          set.completed = true;
          set.completedAt = Date.now();
          btnCheck.classList.add("active");
          row.classList.add("done");

          if (!sessionStartTime && onStartTimer) {
            onStartTimer(Date.now());
          }
          onSaveSession();
          if (ex.restSeconds > 0) onTriggerRest(ex.restSeconds);
        }
      });
    });

    btnCheck.addEventListener("click", (e) => {
      e.stopPropagation();
      set.completed = !set.completed;
      if (set.completed) {
        set.completedAt = Date.now();
        if (!sessionStartTime && onStartTimer) {
          onStartTimer(Date.now());
        }
      } else {
        delete set.completedAt;
      }
      btnCheck.classList.toggle("active", set.completed);
      row.classList.toggle("done", set.completed);
      onSaveSession();

      if (set.completed && ex.restSeconds > 0) {
        onTriggerRest(ex.restSeconds);
      }
    });
  }

  // Кнопка удаления подхода
  row.querySelector(".btn-del-set-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    ex.sets.splice(setIndex, 1);
    ex.sets.forEach((s, idx) => { s.setNumber = idx + 1; });
    onSaveSession();
    onRerender();
  });
}

window.CardioHelper = {
  isCardioExercise,
  getCardioType,
  renderCardioControls,
  renderCardioSetRow
};
