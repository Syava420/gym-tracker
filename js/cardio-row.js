// cardio-row.js
// Модуль рендера строк кардио-подходов (отрезков) для беговой дорожки, велотренажера, эллипса и других тренажеров
// Поддерживает:
// 1. Режим «По дистанции» (фиксированный отрезок, замер времени)
// 2. Режим «На время / Свободный результат» (бег по таймеру, ручной ввод пройденного километража с экрана дорожки)
// 3. Быстрое удаление с мгновенной синхронизацией в шаблон программы
// 4. Автоматическое предложение завершить тренировку при выполнении последнего подхода

function renderCardioSetRow(row, set, setIndex, ex, workout, onSaveSession, onTriggerRest, onRerender, onStartTimer, sessionStartTime, options = {}) {
  const mode = ex.cardioMode || "distance";
  const distUnit = window.CardioHelper ? window.CardioHelper.getDistUnit(ex) : (ex.distUnit || "km");
  const timeUnit = window.CardioHelper ? window.CardioHelper.getTimeUnit(ex) : (ex.timeUnit || "min");
  const meta = window.CardioHelper ? window.CardioHelper.getCardioParamMeta(ex) : { prop: "incline", defaultVal: 1, step: 0.5, min: 0, max: 20 };
  const syncToTemplate = options.syncToTemplate || (() => {
    if (workout && workout.templateId && window.StorageModule && window.StorageModule.updateRoutineExercises) {
      window.StorageModule.updateRoutineExercises(workout.templateId, workout.exercises);
    }
  });
  const onFinish = options.onFinish || null;
  const onUpdateTopNav = options.onUpdateTopNav || null;

  const stopwatchIcon = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M10 2h4"/></svg>`;

  // Проверка завершения всех сетов
  const checkAutoFinish = () => {
    let totalSets = 0;
    let doneSets = 0;
    (workout.exercises || []).forEach((e) => {
      (e.sets || []).forEach((s) => {
        totalSets++;
        if (s.completed) doneSets++;
      });
    });
    if (totalSets > 0 && doneSets === totalSets && onFinish) {
      setTimeout(() => {
        const msg = totalSets === 1
          ? "Отрезок завершен! Завершить и сохранить тренировку?"
          : `Все отрезки (${doneSets} из ${totalSets}) выполнены! Завершить тренировку?`;
        if (confirm(msg)) {
          syncToTemplate();
          onFinish();
        }
      }, 250);
    }
  };

  const paramVal = set[meta.prop] != null ? set[meta.prop] : (set.level != null ? set.level : (ex[meta.prop] != null ? ex[meta.prop] : meta.defaultVal));

  if (mode === "time") {
    // ==============================================================
    // РЕЖИМ 2: НА ВРЕМЯ (СВОБОДНЫЙ КИЛОМЕТРАЖ)
    // Колонки: № | Пред | Время (цель + ⏱️) | Факт дист (км/м) | Уклон/Уровень | ✓ | ✕
    // ==============================================================
    let timeVal = 20;
    if (timeUnit === "sec") {
      timeVal = set.seconds || (set.minutes ? set.minutes * 60 : 1200);
      set.seconds = timeVal;
    } else if (timeUnit === "hour") {
      timeVal = set.hours || (set.minutes ? Math.round((set.minutes / 60) * 100) / 100 : 0.5);
      set.hours = timeVal;
    } else {
      let mins = set.minutes;
      if (!mins) {
        const parsed = parseInt(set.time, 10);
        mins = (!isNaN(parsed) && parsed > 0) ? parsed : (ex.targetMinutes || 20);
        set.minutes = mins;
      }
      timeVal = set.minutes;
    }

    const distVal = set.distance !== undefined && set.distance !== null ? set.distance : "";

    row.innerHTML = `
      <div class="set-num-cell">
        <span class="set-index-badge run">${set.setNumber}</span>
      </div>
      <div class="set-prev-cell">${set.prevInfo || "—"}</div>

      <div class="set-stepper-cell cardio-time-mode-cell">
        <button type="button" class="btn-step btn-dec-time">-</button>
        <input type="number" class="step-input input-time-val" value="${timeVal}">
        <button type="button" class="btn-step btn-inc-time">+</button>
        <button type="button" class="btn-open-cardio-timer" title="Запустить таймер отрезка">${stopwatchIcon}</button>
      </div>

      <div class="set-stepper-cell cardio-fact-dist-cell">
        <input type="number" step="${distUnit === 'm' ? 50 : 0.05}" min="0" class="step-input input-distance-fact" placeholder="${distUnit === 'm' ? 'факт м' : 'факт км'}" value="${distVal}">
      </div>

      <div class="set-stepper-cell cardio-param-mode-cell">
        ${meta.step > 0 ? `
          <button type="button" class="btn-step btn-dec-param">-</button>
          <input type="number" class="step-input input-cardio-set-param" value="${paramVal}" step="${meta.step}">
          <button type="button" class="btn-step btn-inc-param">+</button>
        ` : `<span style="color:#666; font-size:12px;">—</span>`}
      </div>

      <div class="set-check-cell">
        <button type="button" class="btn-complete-set ${set.completed ? "active" : ""}">✓</button>
      </div>

      <div class="set-del-cell">
        <button type="button" class="btn-del-set-btn" title="Удалить подход">✕</button>
      </div>
    `;

    const inputTimeVal = row.querySelector(".input-time-val");
    const inputDistFact = row.querySelector(".input-distance-fact");
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

    // Поле фактической дистанции (ввод с экрана дорожки)
    inputDistFact.addEventListener("change", () => {
      const val = parseFloat(inputDistFact.value);
      set.distance = isNaN(val) ? 0 : val;
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

    // Запуск таймера
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
        onSaveTime: (finalSec) => {
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
          if (onUpdateTopNav) onUpdateTopNav();
          onSaveSession();
          if (ex.restSeconds > 0) onTriggerRest(ex.restSeconds);
          checkAutoFinish();
        }
      });
    });

    // Кнопка выполнения ✓
    btnCheck.addEventListener("click", (e) => {
      e.stopPropagation();
      set.completed = !set.completed;
      if (set.completed) {
        set.completedAt = Date.now();
        const enteredDist = parseFloat(inputDistFact.value);
        if (!isNaN(enteredDist)) set.distance = enteredDist;
        if (!sessionStartTime && onStartTimer) onStartTimer(Date.now());
      } else {
        delete set.completedAt;
      }
      btnCheck.classList.toggle("active", set.completed);
      row.classList.toggle("done", set.completed);
      if (onUpdateTopNav) onUpdateTopNav();
      onSaveSession();

      if (set.completed) {
        if (ex.restSeconds > 0) onTriggerRest(ex.restSeconds);
        checkAutoFinish();
      }
    });

  } else {
    // ==============================================================
    // РЕЖИМ 1: ПО ДИСТАНЦИИ
    // Колонки: № | Пред | Дистанция (цель) | Время отрезка + ⏱️ | Уклон/Уровень | ✓ | ✕
    // ==============================================================
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
        <button type="button" class="btn-open-cardio-timer" title="Запустить секундомер отрезка">${stopwatchIcon}</button>
      </div>

      <div class="set-stepper-cell cardio-param-mode-cell">
        ${meta.step > 0 ? `
          <button type="button" class="btn-step btn-dec-param">-</button>
          <input type="number" class="step-input input-cardio-set-param" value="${paramVal}" step="${meta.step}">
          <button type="button" class="btn-step btn-inc-param">+</button>
        ` : `<span style="color:#666; font-size:12px;">—</span>`}
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
    const inputParam = row.querySelector(".input-cardio-set-param");
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

    // Время
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
    }

    inputTime.addEventListener("change", () => {
      set.time = inputTime.value.trim() || (timeUnit === "sec" ? "90" : "04:20");
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

    // Таймер
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
          if (onUpdateTopNav) onUpdateTopNav();
          onSaveSession();
          if (ex.restSeconds > 0) onTriggerRest(ex.restSeconds);
          checkAutoFinish();
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
      if (onUpdateTopNav) onUpdateTopNav();
      onSaveSession();

      if (set.completed) {
        if (ex.restSeconds > 0) onTriggerRest(ex.restSeconds);
        checkAutoFinish();
      }
    });
  }

  // Кнопка удаления подхода с немедленной синхронизацией в шаблон программы
  row.querySelector(".btn-del-set-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    ex.sets.splice(setIndex, 1);
    ex.sets.forEach((s, idx) => { s.setNumber = idx + 1; });
    syncToTemplate();
    onSaveSession();
    onRerender();
  });
}

if (!window.CardioHelper) window.CardioHelper = {};
window.CardioHelper.renderCardioSetRow = renderCardioSetRow;
window.CardioRow = { renderCardioSetRow };
