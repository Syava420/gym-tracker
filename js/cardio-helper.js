// cardio-helper.js
// Модуль работы с кардио-упражнениями (бег, эллипс, велотренажер)
// Поддерживает:
// 1. Оборудование: Бег (Уклон %), Эллипс (Тяжесть Lvl), Вело (Нагрузка Lvl)
// 2. Единицы дистанции: метры (м) / километры (км) с раздельным переключением в 1 клик
// 3. Единицы времени: секунды (сек) / минуты (мин) с раздельным переключением в 1 клик
// 4. Режимы: «По дистанции» vs «По времени»
// 5. Секундомер / таймер отрезка «Нажал и побежал» (сворачивание, работа в фоне)

function isCardioExercise(ex) {
  if (!ex) return false;
  return Boolean(
    ex.isCardio ||
    ex.category === "Бег" ||
    ex.category === "Эллипс" ||
    ex.category === "Вело" ||
    ex.cardioType === "treadmill" ||
    ex.cardioType === "ellipse" ||
    ex.cardioType === "bike" ||
    (ex.name && (
      ex.name.toLowerCase().includes("бег") ||
      ex.name.toLowerCase().includes("дорожк") ||
      ex.name.toLowerCase().includes("эллипс") ||
      ex.name.toLowerCase().includes("вело") ||
      ex.name.toLowerCase().includes("байк") ||
      ex.name.toLowerCase().includes("интервал") ||
      ex.name.toLowerCase().includes("спринт") ||
      ex.name.toLowerCase().includes("кросс")
    ))
  );
}

function getCardioType(ex) {
  if (!ex) return "treadmill";
  if (ex.cardioType && ["treadmill", "ellipse", "bike"].includes(ex.cardioType)) {
    return ex.cardioType;
  }
  const name = (ex.name || "").toLowerCase();
  const cat = (ex.category || "").toLowerCase();
  const equip = (ex.equip || "").toLowerCase();
  if (cat.includes("вело") || name.includes("вело") || equip.includes("вело") || equip.includes("bike")) {
    return "bike";
  }
  if (cat.includes("эллипс") || name.includes("эллипс") || equip.includes("эллипс")) {
    return "ellipse";
  }
  return "treadmill";
}

function getCardioParamMeta(ex) {
  const type = getCardioType(ex);
  if (type === "bike") {
    return {
      type: "bike",
      name: "Нагрузка",
      shortName: "НАГРУЗКА",
      unit: "lvl",
      prop: "bikeLevel",
      min: 1,
      max: 25,
      step: 1,
      defaultVal: 5
    };
  }
  if (type === "ellipse") {
    return {
      type: "ellipse",
      name: "Тяжесть",
      shortName: "ТЯЖЕСТЬ",
      unit: "lvl",
      prop: "resistanceLevel",
      min: 1,
      max: 25,
      step: 1,
      defaultVal: 5
    };
  }
  return {
    type: "treadmill",
    name: "Уклон",
    shortName: "УКЛОН",
    unit: "%",
    prop: "incline",
    min: 0,
    max: 20,
    step: 0.5,
    defaultVal: 1
  };
}

function getDistUnit(ex) {
  if (ex.distUnit) return ex.distUnit;
  if (ex.targetReps && ex.targetReps.includes("м") && !ex.targetReps.includes("км")) {
    return "m";
  }
  return "km";
}

function getTimeUnit(ex) {
  if (ex.timeUnit) return ex.timeUnit;
  if (ex.targetReps && ex.targetReps.includes("сек")) {
    return "sec";
  }
  return "min";
}

function toggleDistanceUnit(ex, newUnit) {
  const current = getDistUnit(ex);
  if (current === newUnit) return;
  ex.distUnit = newUnit;

  (ex.sets || []).forEach((s) => {
    let d = parseFloat(s.distance);
    if (isNaN(d)) d = ex.defaultDistance || (newUnit === "m" ? 400 : 0.4);
    if (newUnit === "m" && current === "km") {
      s.distance = Math.round(d * 1000);
    } else if (newUnit === "km" && current === "m") {
      s.distance = Math.round((d / 1000) * 100) / 100;
    }
  });
}

function toggleTimeUnit(ex, newUnit) {
  const current = getTimeUnit(ex);
  if (current === newUnit) return;
  ex.timeUnit = newUnit;

  const mode = ex.cardioMode || "distance";
  (ex.sets || []).forEach((s) => {
    if (mode === "time") {
      if (newUnit === "sec") {
        const m = s.minutes || parseInt(s.time) || 20;
        s.seconds = m * 60;
        s.time = `${s.seconds} сек`;
      } else {
        const sec = s.seconds || parseInt(s.time) || 1200;
        s.minutes = Math.max(1, Math.round(sec / 60));
        s.time = `${s.minutes} мин`;
      }
    } else {
      if (newUnit === "sec") {
        if (s.time && s.time.includes(":")) {
          const parts = s.time.split(":");
          s.time = String((parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0));
        } else if (s.time && s.time.includes("мин")) {
          s.time = String((parseInt(s.time, 10) || 1) * 60);
        }
      } else {
        const totalSec = parseInt(s.time, 10);
        if (!isNaN(totalSec) && totalSec > 0 && !String(s.time).includes(":")) {
          const m = Math.floor(totalSec / 60);
          const remSec = totalSec % 60;
          s.time = `${m}:${remSec < 10 ? "0" : ""}${remSec}`;
        }
      }
    }
  });
}

/**
 * Рендерит плашку переключения оборудования (Бег / Эллипс / Вело), режима (Дистанция / Время),
 * единиц измерения (м / км, сек / мин) и быстрого изменения параметра тренажера
 */
function renderCardioControls(container, ex, workout, onSaveSession, onRerender) {
  const type = getCardioType(ex);
  const mode = ex.cardioMode || "distance";
  const distUnit = getDistUnit(ex);
  const timeUnit = getTimeUnit(ex);
  const meta = getCardioParamMeta(ex);

  const curParamVal = ex[meta.prop] !== undefined ? ex[meta.prop] : meta.defaultVal;

  const bar = document.createElement("div");
  bar.className = "cardio-control-bar";

  bar.innerHTML = `
    <div class="cardio-ctrl-row cardio-top-row">
      <div class="cardio-pill-group cardio-type-pills">
        <button type="button" class="btn-cardio-pill ${type === 'treadmill' ? 'active' : ''}" data-type="treadmill">Бег</button>
        <button type="button" class="btn-cardio-pill ${type === 'ellipse' ? 'active' : ''}" data-type="ellipse">Эллипс</button>
        <button type="button" class="btn-cardio-pill ${type === 'bike' ? 'active' : ''}" data-type="bike">Вело</button>
      </div>
      <div class="cardio-pill-group cardio-mode-pills">
        <button type="button" class="btn-cardio-pill ${mode === 'distance' ? 'active' : ''}" data-mode="distance">Дистанция</button>
        <button type="button" class="btn-cardio-pill ${mode === 'time' ? 'active' : ''}" data-mode="time">По времени</button>
      </div>
    </div>

    <div class="cardio-ctrl-row cardio-sub-row">
      <div class="cardio-units-wrap">
        ${mode === 'distance' ? `
          <div class="cardio-unit-box">
            <span class="cub-label">Дист:</span>
            <div class="cardio-unit-toggle" data-kind="dist">
              <button type="button" class="btn-cardio-u ${distUnit === 'm' ? 'active' : ''}" data-unit="m">м</button>
              <button type="button" class="btn-cardio-u ${distUnit === 'km' ? 'active' : ''}" data-unit="km">км</button>
            </div>
          </div>
        ` : ''}
        <div class="cardio-unit-box">
          <span class="cub-label">Время:</span>
          <div class="cardio-unit-toggle" data-kind="time">
            <button type="button" class="btn-cardio-u ${timeUnit === 'sec' ? 'active' : ''}" data-unit="sec">сек</button>
            <button type="button" class="btn-cardio-u ${timeUnit === 'min' ? 'active' : ''}" data-unit="min">мин</button>
          </div>
        </div>
      </div>

      <div class="cardio-param-box">
        <span class="cpb-label">${meta.name}:</span>
        <div class="cpb-stepper">
          <button type="button" class="btn-cqp-step btn-cqp-dec" title="Уменьшить">-</button>
          <span class="cqp-val" id="cqp-val-param">${curParamVal}${meta.unit === '%' ? '%' : ''}</span>
          <button type="button" class="btn-cqp-step btn-cqp-inc" title="Увеличить">+</button>
        </div>
      </div>
    </div>
  `;

  // Переключение оборудования: Бег / Эллипс / Вело
  bar.querySelectorAll(".cardio-type-pills .btn-cardio-pill").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const newType = btn.dataset.type;
      if (ex.cardioType !== newType) {
        ex.cardioType = newType;
        if (newType === "bike") ex.equip = "Велотренажер";
        else if (newType === "ellipse") ex.equip = "Эллипс";
        else ex.equip = "Дорожка";
        onSaveSession();
        onRerender();
      }
    });
  });

  // Переключение режима: Дистанция vs Время
  bar.querySelectorAll(".cardio-mode-pills .btn-cardio-pill").forEach((btn) => {
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

  // Переключение единиц дистанции (м / км)
  const distToggle = bar.querySelector(".cardio-unit-toggle[data-kind='dist']");
  if (distToggle) {
    distToggle.querySelectorAll(".btn-cardio-u").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleDistanceUnit(ex, btn.dataset.unit);
        onSaveSession();
        onRerender();
      });
    });
  }

  // Переключение единиц времени (сек / мин)
  const timeToggle = bar.querySelector(".cardio-unit-toggle[data-kind='time']");
  if (timeToggle) {
    timeToggle.querySelectorAll(".btn-cardio-u").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleTimeUnit(ex, btn.dataset.unit);
        onSaveSession();
        onRerender();
      });
    });
  }

  // Изменение параметра тренажера
  const decBtn = bar.querySelector(".btn-cqp-dec");
  const incBtn = bar.querySelector(".btn-cqp-inc");
  const valSpan = bar.querySelector("#cqp-val-param");

  if (decBtn && incBtn && valSpan) {
    decBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      let current = ex[meta.prop] !== undefined ? ex[meta.prop] : meta.defaultVal;
      let next = meta.step < 1 ? Math.round((current - meta.step) * 10) / 10 : current - meta.step;
      ex[meta.prop] = Math.max(meta.min, next);
      valSpan.textContent = `${ex[meta.prop]}${meta.unit === '%' ? '%' : ''}`;
      (ex.sets || []).forEach((s) => {
        if (!s.completed) {
          if (meta.prop === "incline") s.incline = ex[meta.prop];
          else s.level = ex[meta.prop];
        }
      });
      onSaveSession();
    });

    incBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      let current = ex[meta.prop] !== undefined ? ex[meta.prop] : meta.defaultVal;
      let next = meta.step < 1 ? Math.round((current + meta.step) * 10) / 10 : current + meta.step;
      ex[meta.prop] = Math.min(meta.max, next);
      valSpan.textContent = `${ex[meta.prop]}${meta.unit === '%' ? '%' : ''}`;
      (ex.sets || []).forEach((s) => {
        if (!s.completed) {
          if (meta.prop === "incline") s.incline = ex[meta.prop];
          else s.level = ex[meta.prop];
        }
      });
      onSaveSession();
    });
  }

  container.appendChild(bar);
}

/**
 * Рендер строки кардио-подхода (отрезка)
 * Поддерживает оба режима:
 * - По дистанции: отрезок | пред | дист (м/км) | время (сек/мин) + ⏱️ | ✓ | ✕
 * - По времени: отрезок | пред | время (сек/мин) + ⏱️ | параметр тренажера | ✓ | ✕
 */
function renderCardioSetRow(row, set, setIndex, ex, workout, onSaveSession, onTriggerRest, onRerender, onStartTimer, sessionStartTime) {
  const mode = ex.cardioMode || "distance";
  const distUnit = getDistUnit(ex);
  const timeUnit = getTimeUnit(ex);
  const meta = getCardioParamMeta(ex);

  const stopwatchIcon = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M10 2h4"/></svg>`;

  if (mode === "time") {
    // ================= РЕЖИМ 2: ПО ВРЕМЕНИ =================
    let timeVal = 0;
    if (timeUnit === "sec") {
      timeVal = set.seconds || (set.minutes ? set.minutes * 60 : 1200);
      set.seconds = timeVal;
    } else {
      let mins = set.minutes;
      if (!mins) {
        const parsed = parseInt(set.time, 10);
        mins = (!isNaN(parsed) && parsed > 0) ? parsed : (ex.targetMinutes || 20);
        set.minutes = mins;
      }
      timeVal = set.minutes;
    }

    const paramVal = meta.prop === "incline"
      ? (set.incline != null ? set.incline : (ex.incline != null ? ex.incline : 1))
      : (set.level != null ? set.level : (ex[meta.prop] != null ? ex[meta.prop] : 5));

    row.innerHTML = `
      <div class="set-num-cell">
        <span class="set-index-badge run">${set.setNumber}</span>
      </div>
      <div class="set-prev-cell">${set.prevInfo || "—"}</div>

      <div class="set-stepper-cell cardio-time-mode-cell">
        <button type="button" class="btn-step btn-dec-time">-</button>
        <input type="number" min="${timeUnit === 'sec' ? 5 : 1}" max="${timeUnit === 'sec' ? 7200 : 180}" step="${timeUnit === 'sec' ? 10 : 1}" class="step-input input-time-val" value="${timeVal}">
        <button type="button" class="btn-step btn-inc-time">+</button>
        <button type="button" class="btn-open-cardio-timer" title="Нажал и побежал (запустить таймер)">${stopwatchIcon}</button>
      </div>

      <div class="set-stepper-cell cardio-param-mode-cell">
        <button type="button" class="btn-step btn-dec-param">-</button>
        <input type="number" class="step-input input-cardio-set-param" value="${paramVal}" step="${meta.step}">
        <button type="button" class="btn-step btn-inc-param">+</button>
      </div>

      <div class="set-check-cell">
        <button type="button" class="btn-complete-set ${set.completed ? "active" : ""}">✓</button>
      </div>

      <div class="set-del-cell">
        <button type="button" class="btn-del-set-btn" title="Удалить подход">✕</button>
      </div>
    `;

    const inputTimeVal = row.querySelector(".input-time-val");
    const inputParam = row.querySelector(".input-cardio-set-param");
    const btnCheck = row.querySelector(".btn-complete-set");
    const timerBtn = row.querySelector(".btn-open-cardio-timer");

    // Степер времени (сек или мин)
    row.querySelector(".btn-dec-time").addEventListener("click", (e) => {
      e.stopPropagation();
      if (timeUnit === "sec") {
        set.seconds = Math.max(5, (set.seconds || 1200) - ((set.seconds || 1200) > 60 ? 30 : 10));
        inputTimeVal.value = set.seconds;
        set.time = `${set.seconds} сек`;
      } else {
        set.minutes = Math.max(1, (set.minutes || 20) - ((set.minutes || 20) > 5 ? 5 : 1));
        inputTimeVal.value = set.minutes;
        set.time = `${set.minutes} мин`;
      }
      onSaveSession();
    });

    row.querySelector(".btn-inc-time").addEventListener("click", (e) => {
      e.stopPropagation();
      if (timeUnit === "sec") {
        set.seconds = (set.seconds || 1200) + ((set.seconds || 1200) >= 60 ? 30 : 10);
        inputTimeVal.value = set.seconds;
        set.time = `${set.seconds} сек`;
      } else {
        set.minutes = (set.minutes || 20) + 5;
        inputTimeVal.value = set.minutes;
        set.time = `${set.minutes} мин`;
      }
      onSaveSession();
    });

    inputTimeVal.addEventListener("change", () => {
      const val = parseInt(inputTimeVal.value, 10);
      if (timeUnit === "sec") {
        set.seconds = isNaN(val) || val <= 0 ? 60 : val;
        set.time = `${set.seconds} сек`;
      } else {
        set.minutes = isNaN(val) || val <= 0 ? 20 : val;
        set.time = `${set.minutes} мин`;
      }
      onSaveSession();
    });

    // Степер параметра (уклон / тяжесть / нагрузка)
    row.querySelector(".btn-dec-param").addEventListener("click", (e) => {
      e.stopPropagation();
      let cur = parseFloat(inputParam.value) || meta.defaultVal;
      let next = meta.step < 1 ? Math.round((cur - meta.step) * 10) / 10 : cur - meta.step;
      const res = Math.max(meta.min, next);
      if (meta.prop === "incline") set.incline = res;
      else set.level = res;
      inputParam.value = res;
      onSaveSession();
    });

    row.querySelector(".btn-inc-param").addEventListener("click", (e) => {
      e.stopPropagation();
      let cur = parseFloat(inputParam.value) || meta.defaultVal;
      let next = meta.step < 1 ? Math.round((cur + meta.step) * 10) / 10 : cur + meta.step;
      const res = Math.min(meta.max, next);
      if (meta.prop === "incline") set.incline = res;
      else set.level = res;
      inputParam.value = res;
      onSaveSession();
    });

    inputParam.addEventListener("change", () => {
      const val = parseFloat(inputParam.value);
      const res = isNaN(val) ? meta.defaultVal : Math.max(meta.min, Math.min(meta.max, val));
      if (meta.prop === "incline") set.incline = res;
      else set.level = res;
      onSaveSession();
    });

    // Таймер «Нажал и побежал»
    timerBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const currentTargetSec = timeUnit === "sec" ? (set.seconds || 60) : ((set.minutes || 20) * 60);
      window.StopwatchModal.openCardioTimerModal({
        title: ex.name,
        targetSeconds: currentTargetSec,
        mode: "time",
        timeUnit,
        incline: meta.prop === "incline" ? (set.incline != null ? set.incline : ex.incline) : null,
        level: meta.type === "ellipse" ? (set.level != null ? set.level : ex.resistanceLevel) : null,
        bikeLevel: meta.type === "bike" ? (set.level != null ? set.level : ex.bikeLevel) : null,
        defaultTimeStr: timeUnit === "sec" ? `${currentTargetSec} сек` : `${Math.round(currentTargetSec / 60)} мин`,
        onSaveTime: (finalSec, timeFormatted) => {
          if (timeUnit === "sec") {
            set.seconds = finalSec;
            set.time = `${finalSec} сек`;
            inputTimeVal.value = finalSec;
          } else {
            const actualMins = Math.max(1, Math.round(finalSec / 60));
            set.minutes = actualMins;
            set.time = `${actualMins} мин`;
            inputTimeVal.value = actualMins;
          }
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
    // ================= РЕЖИМ 1: ПО ДИСТАНЦИИ =================
    const rawDist = set.distance !== undefined ? set.distance : (ex.defaultDistance || (distUnit === "m" ? 400 : 0.4));
    const dist = distUnit === "m" ? (rawDist < 10 ? Math.round(rawDist * 1000) : Math.round(rawDist)) : (rawDist > 50 ? Math.round((rawDist / 1000) * 100) / 100 : rawDist);
    set.distance = dist;

    let timeVal = set.time || set.reps || ex.defaultPace || (timeUnit === "sec" ? "90" : "04:20");

    row.innerHTML = `
      <div class="set-num-cell">
        <span class="set-index-badge run">${set.setNumber}</span>
      </div>
      <div class="set-prev-cell">${set.prevInfo || "—"}</div>
      
      <div class="set-stepper-cell cardio-stepper">
        <button type="button" class="btn-step btn-dec-dist">-</button>
        <input type="number" step="${distUnit === 'm' ? 50 : 0.1}" min="${distUnit === 'm' ? 10 : 0.05}" class="step-input input-distance" value="${dist}">
        <button type="button" class="btn-step btn-inc-dist">+</button>
      </div>

      <div class="set-stepper-cell cardio-time-cell">
        ${timeUnit === 'sec' ? `
          <button type="button" class="btn-step btn-dec-sec-time">-</button>
          <input type="number" step="5" min="5" class="step-input input-time" value="${parseInt(timeVal, 10) || 90}">
          <button type="button" class="btn-step btn-inc-sec-time">+</button>
        ` : `
          <input type="text" class="step-input input-time" value="${timeVal}" placeholder="04:20">
        `}
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

    // Степер дистанции
    row.querySelector(".btn-dec-dist").addEventListener("click", (e) => {
      e.stopPropagation();
      let current = parseFloat(set.distance) || (distUnit === "m" ? 400 : 0.4);
      if (distUnit === "m") {
        set.distance = Math.max(10, current - 50);
      } else {
        set.distance = Math.max(0.05, Math.round((current - 0.1) * 10) / 10);
      }
      inputDist.value = set.distance;
      onSaveSession();
    });

    row.querySelector(".btn-inc-dist").addEventListener("click", (e) => {
      e.stopPropagation();
      let current = parseFloat(set.distance) || (distUnit === "m" ? 400 : 0.4);
      if (distUnit === "m") {
        set.distance = current + 50;
      } else {
        set.distance = Math.round((current + 0.1) * 10) / 10;
      }
      inputDist.value = set.distance;
      onSaveSession();
    });

    inputDist.addEventListener("change", () => {
      const val = parseFloat(inputDist.value);
      set.distance = isNaN(val) ? (distUnit === "m" ? 400 : 0.4) : val;
      onSaveSession();
    });

    // Изменение времени (секунды или текстовый темп)
    if (timeUnit === "sec") {
      const decSecBtn = row.querySelector(".btn-dec-sec-time");
      const incSecBtn = row.querySelector(".btn-inc-sec-time");
      if (decSecBtn && incSecBtn) {
        decSecBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          let cur = parseInt(inputTime.value, 10) || 90;
          let next = Math.max(5, cur - 5);
          inputTime.value = next;
          set.time = String(next);
          onSaveSession();
        });
        incSecBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          let cur = parseInt(inputTime.value, 10) || 90;
          let next = cur + 5;
          inputTime.value = next;
          set.time = String(next);
          onSaveSession();
        });
      }
    }

    inputTime.addEventListener("change", () => {
      set.time = inputTime.value.trim() || (timeUnit === "sec" ? "90" : "04:20");
      onSaveSession();
    });

    // Таймер отрезка
    timerBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const currentDist = set.distance || (distUnit === "m" ? 400 : 0.4);
      window.StopwatchModal.openCardioTimerModal({
        title: ex.name,
        mode: "distance",
        distance: currentDist,
        distUnit,
        timeUnit,
        incline: meta.prop === "incline" ? (set.incline != null ? set.incline : ex.incline) : null,
        level: meta.type === "ellipse" ? (set.level != null ? set.level : ex.resistanceLevel) : null,
        bikeLevel: meta.type === "bike" ? (set.level != null ? set.level : ex.bikeLevel) : null,
        defaultTimeStr: set.time || (timeUnit === "sec" ? "90" : "04:20"),
        onSaveTime: (finalSec, timeFormatted) => {
          if (timeUnit === "sec") {
            set.time = String(finalSec);
            inputTime.value = finalSec;
          } else {
            set.time = timeFormatted;
            inputTime.value = timeFormatted;
          }
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
  getCardioParamMeta,
  getDistUnit,
  getTimeUnit,
  toggleDistanceUnit,
  toggleTimeUnit,
  renderCardioControls,
  renderCardioSetRow
};
