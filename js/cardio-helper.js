// cardio-helper.js
// Модуль работы с кардио-упражнениями (бег, велотренажер, эллипс, гребля, степпер, улица)
// Поддерживает:
// 1. Оборудование и параметры тренажеров (Уклон %, Нагрузка Lvl, Тяжесть Lvl)
// 2. Интерактивное циклическое переключение единиц по клику в шапке таблицы:
//    - Дистанция: [ км ⇄ м ]
//    - Время: [ мин ⇄ сек ⇄ час ]
// 3. Режимы «По дистанции» и «По времени»
// 4. Секундомер / таймер отрезка «Нажал и побежал» (сворачивание, работа в фоне)

function isCardioExercise(ex) {
  if (!ex) return false;
  return Boolean(
    ex.isCardio ||
    ex.category === "Бег" ||
    ex.category === "Эллипс" ||
    ex.category === "Вело" ||
    ex.category === "Кардио" ||
    ["treadmill", "bike", "ellipse", "rower", "stepper", "outdoor"].includes(ex.cardioType) ||
    (ex.name && (
      ex.name.toLowerCase().includes("бег") ||
      ex.name.toLowerCase().includes("дорожк") ||
      ex.name.toLowerCase().includes("эллипс") ||
      ex.name.toLowerCase().includes("вело") ||
      ex.name.toLowerCase().includes("байк") ||
      ex.name.toLowerCase().includes("гребл") ||
      ex.name.toLowerCase().includes("степпер") ||
      ex.name.toLowerCase().includes("интервал") ||
      ex.name.toLowerCase().includes("спринт") ||
      ex.name.toLowerCase().includes("кросс")
    ))
  );
}

function getCardioType(ex) {
  if (!ex) return "treadmill";
  if (ex.cardioType && ["treadmill", "bike", "ellipse", "rower", "stepper", "outdoor"].includes(ex.cardioType)) {
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
  if (name.includes("гребл") || equip.includes("гребл")) {
    return "rower";
  }
  if (name.includes("степпер") || equip.includes("степпер") || name.includes("лестниц")) {
    return "stepper";
  }
  if (equip.includes("улиц") || equip.includes("манеж") || name.includes("улиц")) {
    return "outdoor";
  }
  return "treadmill";
}

function getCardioParamMeta(ex) {
  const type = getCardioType(ex);
  switch (type) {
    case "bike":
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
    case "ellipse":
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
    case "rower":
      return {
        type: "rower",
        name: "Тяжесть",
        shortName: "ТЯЖЕСТЬ",
        unit: "lvl",
        prop: "rowerLevel",
        min: 1,
        max: 10,
        step: 1,
        defaultVal: 5
      };
    case "stepper":
      return {
        type: "stepper",
        name: "Уровень",
        shortName: "УРОВЕНЬ",
        unit: "lvl",
        prop: "stepperLevel",
        min: 1,
        max: 20,
        step: 1,
        defaultVal: 5
      };
    case "outdoor":
      return {
        type: "outdoor",
        name: "Уклон",
        shortName: "УКЛОН",
        unit: "%",
        prop: "incline",
        min: 0,
        max: 0,
        step: 0,
        defaultVal: 0
      };
    case "treadmill":
    default:
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
  if (ex.targetReps && (ex.targetReps.includes("сек") || ex.targetReps.includes("с"))) {
    return "sec";
  }
  if (ex.targetReps && (ex.targetReps.includes("час") || ex.targetReps.includes("ч"))) {
    return "hour";
  }
  return "min";
}

/**
 * Переключение единиц дистанции по клику в шапке: км ⇄ м
 */
function cycleDistanceUnit(ex) {
  const current = getDistUnit(ex);
  const next = current === "km" ? "m" : "km";
  ex.distUnit = next;

  (ex.sets || []).forEach((s) => {
    let d = parseFloat(s.distance);
    if (isNaN(d)) d = ex.defaultDistance || (next === "m" ? 400 : 0.4);
    if (next === "m") {
      s.distance = Math.round(d * 1000);
    } else {
      s.distance = Math.round((d / 1000) * 100) / 100;
    }
  });

  if (ex.defaultDistance) {
    if (next === "m") {
      ex.defaultDistance = Math.round(ex.defaultDistance * 1000);
    } else {
      ex.defaultDistance = Math.round((ex.defaultDistance / 1000) * 100) / 100;
    }
  }

  return next;
}

/**
 * Циклическое переключение единиц времени по клику в шапке: мин ⇄ сек ⇄ час
 */
function cycleTimeUnit(ex) {
  const current = getTimeUnit(ex);
  let next = "min";
  if (current === "min") next = "sec";
  else if (current === "sec") next = "hour";
  else next = "min";

  ex.timeUnit = next;
  const isTimeMode = ex.cardioMode === "time";

  (ex.sets || []).forEach((s) => {
    // Вычисляем текущее общее количество секунд
    let totalSec = 0;
    if (current === "sec") {
      totalSec = s.seconds || parseInt(s.time, 10) || 60;
    } else if (current === "hour") {
      const h = s.hours || parseFloat(s.time) || 0.5;
      totalSec = Math.round(h * 3600);
    } else {
      // min
      if (s.time && String(s.time).includes(":")) {
        const parts = String(s.time).split(":");
        totalSec = (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
      } else {
        const m = s.minutes || parseInt(s.time, 10) || 20;
        totalSec = m * 60;
      }
    }

    if (totalSec <= 0) totalSec = 1200;

    if (next === "sec") {
      s.seconds = totalSec;
      s.time = isTimeMode ? `${totalSec} сек` : String(totalSec);
    } else if (next === "hour") {
      const h = Math.round((totalSec / 3600) * 100) / 100;
      s.hours = h;
      s.time = isTimeMode ? `${h} ч` : String(h);
    } else {
      // min
      const m = Math.max(1, Math.round(totalSec / 60));
      s.minutes = m;
      if (isTimeMode) {
        s.time = `${m} мин`;
      } else {
        const remSec = totalSec % 60;
        s.time = `${m}:${remSec < 10 ? "0" : ""}${remSec}`;
      }
    }
  });

  return next;
}

/**
 * Рендер строки кардио-подхода (отрезка)
 * Поддерживает оба режима:
 * - По дистанции: отрезок | пред | дист (м/км) | время (сек/мин/час) + ⏱️ | ✓ | ✕
 * - По времени: отрезок | пред | время (сек/мин/час) + ⏱️ | параметр тренажера | ✓ | ✕
 */
function renderCardioSetRow(row, set, setIndex, ex, workout, onSaveSession, onTriggerRest, onRerender, onStartTimer, sessionStartTime) {
  const mode = ex.cardioMode || "distance";
  const distUnit = getDistUnit(ex);
  const timeUnit = getTimeUnit(ex);
  const meta = getCardioParamMeta(ex);

  const stopwatchIcon = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M10 2h4"/></svg>`;

  if (mode === "time") {
    // ================= РЕЖИМ 2: ПО ВРЕМЕНИ =================
    let timeVal = 20;
    let stepVal = 1;
    let minVal = 1;
    let maxVal = 180;

    if (timeUnit === "sec") {
      timeVal = set.seconds || (set.minutes ? set.minutes * 60 : 1200);
      set.seconds = timeVal;
      stepVal = 10;
      minVal = 5;
      maxVal = 7200;
    } else if (timeUnit === "hour") {
      timeVal = set.hours || (set.minutes ? Math.round((set.minutes / 60) * 100) / 100 : 0.5);
      set.hours = timeVal;
      stepVal = 0.25;
      minVal = 0.1;
      maxVal = 24;
    } else {
      let mins = set.minutes;
      if (!mins) {
        const parsed = parseInt(set.time, 10);
        mins = (!isNaN(parsed) && parsed > 0) ? parsed : (ex.targetMinutes || 20);
        set.minutes = mins;
      }
      timeVal = set.minutes;
      stepVal = 1;
      minVal = 1;
      maxVal = 180;
    }

    const paramVal = set[meta.prop] != null ? set[meta.prop] : (set.level != null ? set.level : (ex[meta.prop] != null ? ex[meta.prop] : meta.defaultVal));

    row.innerHTML = `
      <div class="set-num-cell">
        <span class="set-index-badge run">${set.setNumber}</span>
      </div>
      <div class="set-prev-cell">${set.prevInfo || "—"}</div>

      <div class="set-stepper-cell cardio-time-mode-cell">
        <button type="button" class="btn-step btn-dec-time">-</button>
        <input type="number" min="${minVal}" max="${maxVal}" step="${stepVal}" class="step-input input-time-val" value="${timeVal}">
        <button type="button" class="btn-step btn-inc-time">+</button>
        <button type="button" class="btn-open-cardio-timer" title="Нажал и побежал (запустить таймер)">${stopwatchIcon}</button>
      </div>

      <div class="set-stepper-cell cardio-param-mode-cell">
        ${meta.step > 0 ? `
          <button type="button" class="btn-step btn-dec-param">-</button>
          <input type="number" class="step-input input-cardio-set-param" value="${paramVal}" step="${meta.step}">
          <button type="button" class="btn-step btn-inc-param">+</button>
        ` : `
          <span style="color:#666; font-size:12px;">—</span>
        `}
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

    // Степер времени
    row.querySelector(".btn-dec-time").addEventListener("click", (e) => {
      e.stopPropagation();
      if (timeUnit === "sec") {
        set.seconds = Math.max(5, (set.seconds || 1200) - ((set.seconds || 1200) > 60 ? 30 : 10));
        inputTimeVal.value = set.seconds;
        set.time = `${set.seconds} сек`;
      } else if (timeUnit === "hour") {
        set.hours = Math.max(0.1, Math.round(((set.hours || 0.5) - 0.25) * 100) / 100);
        inputTimeVal.value = set.hours;
        set.time = `${set.hours} ч`;
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
      } else if (timeUnit === "hour") {
        set.hours = Math.round(((set.hours || 0.5) + 0.25) * 100) / 100;
        inputTimeVal.value = set.hours;
        set.time = `${set.hours} ч`;
      } else {
        set.minutes = (set.minutes || 20) + 5;
        inputTimeVal.value = set.minutes;
        set.time = `${set.minutes} мин`;
      }
      onSaveSession();
    });

    inputTimeVal.addEventListener("change", () => {
      if (timeUnit === "sec") {
        const val = parseInt(inputTimeVal.value, 10);
        set.seconds = isNaN(val) || val <= 0 ? 60 : val;
        set.time = `${set.seconds} сек`;
      } else if (timeUnit === "hour") {
        const val = parseFloat(inputTimeVal.value);
        set.hours = isNaN(val) || val <= 0 ? 0.5 : val;
        set.time = `${set.hours} ч`;
      } else {
        const val = parseInt(inputTimeVal.value, 10);
        set.minutes = isNaN(val) || val <= 0 ? 20 : val;
        set.time = `${set.minutes} мин`;
      }
      onSaveSession();
    });

    // Степер параметра тренажера
    if (inputParam && meta.step > 0) {
      row.querySelector(".btn-dec-param").addEventListener("click", (e) => {
        e.stopPropagation();
        let cur = parseFloat(inputParam.value) || meta.defaultVal;
        let next = meta.step < 1 ? Math.round((cur - meta.step) * 10) / 10 : cur - meta.step;
        const res = Math.max(meta.min, next);
        set[meta.prop] = res;
        set.level = res;
        inputParam.value = res;
        onSaveSession();
      });

      row.querySelector(".btn-inc-param").addEventListener("click", (e) => {
        e.stopPropagation();
        let cur = parseFloat(inputParam.value) || meta.defaultVal;
        let next = meta.step < 1 ? Math.round((cur + meta.step) * 10) / 10 : cur + meta.step;
        const res = Math.min(meta.max, next);
        set[meta.prop] = res;
        set.level = res;
        inputParam.value = res;
        onSaveSession();
      });

      inputParam.addEventListener("change", () => {
        const val = parseFloat(inputParam.value);
        const res = isNaN(val) ? meta.defaultVal : Math.max(meta.min, Math.min(meta.max, val));
        set[meta.prop] = res;
        set.level = res;
        onSaveSession();
      });
    }

    // Кнопка секундомера «Нажал и побежал»
    timerBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      let currentTargetSec = 1200;
      if (timeUnit === "sec") currentTargetSec = set.seconds || 60;
      else if (timeUnit === "hour") currentTargetSec = Math.round((set.hours || 0.5) * 3600);
      else currentTargetSec = (set.minutes || 20) * 60;

      window.StopwatchModal.openCardioTimerModal({
        title: ex.name,
        targetSeconds: currentTargetSec,
        mode: "time",
        timeUnit,
        incline: meta.prop === "incline" ? (set.incline != null ? set.incline : ex.incline) : null,
        level: meta.prop !== "incline" ? (set[meta.prop] != null ? set[meta.prop] : (set.level != null ? set.level : ex[meta.prop])) : null,
        defaultTimeStr: set.time || `${Math.round(currentTargetSec / 60)} мин`,
        onSaveTime: (finalSec, timeFormatted) => {
          if (timeUnit === "sec") {
            set.seconds = finalSec;
            set.time = `${finalSec} сек`;
            inputTimeVal.value = finalSec;
          } else if (timeUnit === "hour") {
            const h = Math.round((finalSec / 3600) * 100) / 100;
            set.hours = h;
            set.time = `${h} ч`;
            inputTimeVal.value = h;
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

    let timeVal = set.time || set.reps || ex.defaultPace || (timeUnit === "sec" ? "90" : (timeUnit === "hour" ? "0.5" : "04:20"));

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
        ` : timeUnit === 'hour' ? `
          <button type="button" class="btn-step btn-dec-sec-time">-</button>
          <input type="number" step="0.25" min="0.1" class="step-input input-time" value="${parseFloat(timeVal) || 0.5}">
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

    // Редактирование времени (секунды, часы или текстовый темп)
    if (timeUnit === "sec") {
      const decBtn = row.querySelector(".btn-dec-sec-time");
      const incBtn = row.querySelector(".btn-inc-sec-time");
      if (decBtn && incBtn) {
        decBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          let cur = parseInt(inputTime.value, 10) || 90;
          let next = Math.max(5, cur - 5);
          inputTime.value = next;
          set.time = String(next);
          onSaveSession();
        });
        incBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          let cur = parseInt(inputTime.value, 10) || 90;
          let next = cur + 5;
          inputTime.value = next;
          set.time = String(next);
          onSaveSession();
        });
      }
    } else if (timeUnit === "hour") {
      const decBtn = row.querySelector(".btn-dec-sec-time");
      const incBtn = row.querySelector(".btn-inc-sec-time");
      if (decBtn && incBtn) {
        decBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          let cur = parseFloat(inputTime.value) || 0.5;
          let next = Math.max(0.1, Math.round((cur - 0.25) * 100) / 100);
          inputTime.value = next;
          set.time = String(next);
          onSaveSession();
        });
        incBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          let cur = parseFloat(inputTime.value) || 0.5;
          let next = Math.round((cur + 0.25) * 100) / 100;
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
        level: meta.prop !== "incline" ? (set[meta.prop] != null ? set[meta.prop] : (set.level != null ? set.level : ex[meta.prop])) : null,
        defaultTimeStr: set.time || (timeUnit === "sec" ? "90" : "04:20"),
        onSaveTime: (finalSec, timeFormatted) => {
          if (timeUnit === "sec") {
            set.time = String(finalSec);
            inputTime.value = finalSec;
          } else if (timeUnit === "hour") {
            const h = Math.round((finalSec / 3600) * 100) / 100;
            set.time = String(h);
            inputTime.value = h;
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
  cycleDistanceUnit,
  cycleTimeUnit,
  renderCardioSetRow
};
