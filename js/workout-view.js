// Модуль экрана активной тренировки: карточки упражнений, смена порядка (↑/↓), замена, силовые и беговые подходы

function renderWorkoutView(container, options) {
  const {
    workout,
    sessionStartTime,
    onBack,
    onFinish,
    onCancel,
    onSaveSession,
    onTriggerRest,
    onRerender,
    onStartTimer
  } = options;

  if (!workout) {
    onBack();
    return;
  }

  container.innerHTML = "";

  // Подсчёт прогресса
  let totalSets = 0;
  let doneSets = 0;
  workout.exercises.forEach((e) => {
    (e.sets || []).forEach((s) => {
      totalSets++;
      if (s.completed) doneSets++;
    });
  });

  const hasStarted = Boolean(sessionStartTime || doneSets > 0);
  const canFinish = doneSets > 0;

  // Функция синхронизации упражнений обратно в шаблон программы на главном экране
  const syncToTemplate = () => {
    if (workout.templateId && window.StorageModule.updateRoutineExercises) {
      window.StorageModule.updateRoutineExercises(workout.templateId, workout.exercises);
    }
  };

  // 1. Верхняя панель тренировки
  const topNav = document.createElement("div");
  topNav.className = "workout-topbar";

  const updateTopNav = () => {
    let currentDone = 0;
    (workout.exercises || []).forEach((e) => {
      (e.sets || []).forEach((s) => {
        if (s.completed) currentDone++;
      });
    });
    const isRunning = Boolean(sessionStartTime || currentDone > 0);
    const stopwatchEl = topNav.querySelector("#workout-stopwatch");
    if (stopwatchEl && !sessionStartTime) {
      stopwatchEl.textContent = "—";
    }

    const leftBox = topNav.querySelector(".workout-topbar-left");
    if (leftBox) {
      let cancelBtn = leftBox.querySelector("#btn-cancel-workout");
      if (isRunning && !cancelBtn) {
        cancelBtn = document.createElement("button");
        cancelBtn.type = "button";
        cancelBtn.className = "btn-cancel-mini";
        cancelBtn.id = "btn-cancel-workout";
        cancelBtn.title = "Сбросить тренировку";
        cancelBtn.textContent = "Сброс";
        cancelBtn.addEventListener("click", () => {
          if (confirm(`Сбросить и отменить тренировку «${workout.title}»? Данные не сохранятся.`)) {
            if (onCancel) onCancel();
          }
        });
        leftBox.appendChild(cancelBtn);
      } else if (!isRunning && cancelBtn) {
        cancelBtn.remove();
      }
    }

    const rightBox = topNav.querySelector(".workout-topbar-right");
    if (rightBox) {
      rightBox.innerHTML = "";
      if (isRunning) {
        const finishBtn = document.createElement("button");
        finishBtn.type = "button";
        finishBtn.className = "btn-finish-minimal";
        finishBtn.id = "btn-finish-workout";
        finishBtn.textContent = "Завершить";
        finishBtn.addEventListener("click", () => {
          syncToTemplate();
          onFinish();
        });
        rightBox.appendChild(finishBtn);
      } else {
        const startBtn = document.createElement("button");
        startBtn.type = "button";
        startBtn.className = "btn-start-minimal";
        startBtn.id = "btn-start-workout";
        startBtn.textContent = "Старт";
        startBtn.addEventListener("click", () => {
          const now = Date.now();
          if (onStartTimer) onStartTimer(now);
          updateTopNav();
        });
        rightBox.appendChild(startBtn);
      }
    }
  };

  topNav.innerHTML = `
    <div class="workout-topbar-left">
      <button type="button" class="btn-back-text" id="btn-back-workout">← Выход</button>
    </div>
    <div class="workout-header-center">
      <div class="workout-header-title">${workout.title}</div>
      <div class="workout-header-timer" id="workout-stopwatch">${sessionStartTime ? "00:00" : "—"}</div>
    </div>
    <div class="workout-topbar-right"></div>
  `;

  topNav.querySelector("#btn-back-workout").addEventListener("click", () => {
    syncToTemplate();
    onSaveSession();
    onBack();
  });
  updateTopNav();
  container.appendChild(topNav);

  // Баннер, если все подходы выполнены
  if (totalSets > 0 && totalSets === doneSets) {
    const doneNotice = document.createElement("div");
    doneNotice.className = "all-done-banner";
    doneNotice.innerHTML = `Все упражнения выполнены! Нажмите «Завершить» вверху.`;
    container.appendChild(doneNotice);
  }

  // Если в тренировке пока нет упражнений — аккуратный текст
  if (workout.exercises.length === 0) {
    const emptyNotice = document.createElement("div");
    emptyNotice.className = "empty-workout-box";
    emptyNotice.innerHTML = `
      <div style="text-align:center; padding: 48px 16px 20px 16px;">
        <div style="font-size: 15px; font-weight: 700; color: #ffffff; margin-bottom: 6px;">В этой тренировке пока нет упражнений</div>
        <div style="font-size: 12px; color: #888888; max-width: 280px; margin: 0 auto;">Нажмите кнопку ниже, чтобы добавить первое упражнение. Оно автоматически сохранится в эту программу.</div>
      </div>
    `;
    container.appendChild(emptyNotice);
  }

  // 2. Список упражнений
  workout.exercises.forEach((ex, exIndex) => {
    const card = document.createElement("div");
    card.className = "ex-card";

    const isCardio = window.CardioHelper ? window.CardioHelper.isCardioExercise(ex) : Boolean(ex.isCardio || ex.category === "Бег" || ex.category === "Эллипс" || ex.category === "Вело");
    const videoUrl = ex.youtubeUrl || `https://www.youtube.com/results?search_query=${encodeURIComponent("техника " + ex.name)}`;
    const isTimed = !isCardio && ((ex.name && (ex.name.toLowerCase().includes("вис") || ex.name.toLowerCase().includes("планк") || ex.name.toLowerCase().includes("вакуум"))) || (ex.targetReps && String(ex.targetReps).includes("сек")));
    const exPR = window.StorageModule.getExercisePR(ex.id, ex.name);
    const prBadge = exPR && (exPR.weight > 0 || exPR.distance > 0)
      ? ` • <span class="pr-badge">Рекорд: ${exPR.weight ? exPR.weight + " кг" : (ex.distUnit === "m" ? exPR.distance + " м" : exPR.distance + " км")}</span>`
      : "";

    // Динамические заголовки колонок для кардио
    let cardioWeightCol = "ДИСТ (КМ)";
    let cardioRepsCol = "ТЕМП / ВР";
    let isMainToggleable = false;
    let isSubToggleable = false;
    let paramBadge = "";

    if (isCardio) {
      const dUnit = window.CardioHelper ? window.CardioHelper.getDistUnit(ex) : (ex.distUnit || "km");
      const tUnit = window.CardioHelper ? window.CardioHelper.getTimeUnit(ex) : (ex.timeUnit || "min");
      const paramMeta = window.CardioHelper ? window.CardioHelper.getCardioParamMeta(ex) : null;

      if (paramMeta) {
        const val = ex[paramMeta.prop] !== undefined ? ex[paramMeta.prop] : (ex.sets && ex.sets[0] && ex.sets[0][paramMeta.prop] !== undefined ? ex.sets[0][paramMeta.prop] : (ex.sets && ex.sets[0] && ex.sets[0].level !== undefined ? ex.sets[0].level : paramMeta.defaultVal));
        if (paramMeta.type === "treadmill" && val > 0) {
          paramBadge = `Уклон ${val}% • `;
        } else if (paramMeta.step > 0 && val > 0) {
          paramBadge = `${paramMeta.name} ${val} • `;
        }
      }

      const dUnitShort = dUnit === "m" ? "М" : "КМ";
      const tUnitShort = tUnit === "sec" ? "С" : (tUnit === "hour" ? "Ч" : "М");
      if (ex.cardioMode === "time") {
        cardioWeightCol = `ВРЕМЯ (${tUnitShort})`;
        cardioRepsCol = `ФАКТ (${dUnitShort})`;
        cardioParamCol = paramMeta ? paramMeta.shortName : "УКЛОН";
      } else {
        cardioWeightCol = `ДИСТ (${dUnitShort})`;
        cardioRepsCol = `ВРЕМЯ (${tUnitShort})`;
        cardioParamCol = paramMeta ? paramMeta.shortName : "УКЛОН";
      }
    }

    card.innerHTML = `
      <div class="ex-title-row">
        <div class="ex-title-box">
          <a href="${videoUrl}" target="_blank" class="ex-title-clean-link" title="Нажми, чтобы открыть видео техники">
            ${exIndex + 1}. ${ex.name}
          </a>
        </div>
        <div class="ex-card-actions">
          <button type="button" class="btn-card-tool btn-move-up" title="Поднять выше" ${exIndex === 0 ? "disabled" : ""}>↑</button>
          <button type="button" class="btn-card-tool btn-move-down" title="Опустить ниже" ${exIndex === workout.exercises.length - 1 ? "disabled" : ""}>↓</button>
          <button type="button" class="btn-card-tool btn-replace-ex" title="Заменить упражнение">Заменить</button>
          <button type="button" class="btn-card-tool btn-edit-ex" title="Настроить ссылку и параметры">Ред.</button>
          <button type="button" class="btn-card-tool btn-del-ex" title="Удалить упражнение">✕</button>
        </div>
      </div>

      <div class="ex-target-info">
        ${isCardio 
          ? `${ex.sets.length} отрезка • Цель: ${ex.targetReps || (ex.defaultDistance ? (ex.distUnit === 'm' ? ex.defaultDistance + ' м' : ex.defaultDistance + ' км') : "Кардио")} • ${paramBadge}${ex.targetSpeed ? `⚡ ${ex.targetSpeed} • ` : ""}Отдых ${window.TimerModule.formatTime(ex.restSeconds || 0)}`
          : `${ex.sets.length} подх. по ${ex.targetReps || "10-12"} • Отдых ${window.TimerModule.formatTime(ex.restSeconds != null ? ex.restSeconds : 60)} ${isTimed ? '• <span class="timed-badge">На время</span>' : ""}`
        }
        ${isCardio ? ' • <span class="run-badge">Кардио</span>' : ""}
        ${prBadge}
      </div>

      <div class="ex-tip-box" contenteditable="true" title="Кликни, чтобы изменить заметку">${ex.tip || "Нажми сюда, чтобы написать свою заметку"}</div>

      <div class="sets-header-row ${isCardio ? "cardio-header" : ""}">
        <span class="sh-num">${isCardio ? "№" : "СЕТ"}</span>
        <span class="sh-prev">ПРЕД</span>
        ${isCardio ? `
          <button type="button" class="sh-col-btn sh-col-toggle-main" id="th-toggle-main-${exIndex}" title="Нажми, чтобы переключить единицы">
            ${cardioWeightCol} <span class="th-swap-icon">⇄</span>
          </button>
          <button type="button" class="sh-col-btn sh-col-toggle-sub" id="th-toggle-sub-${exIndex}" title="Нажми, чтобы переключить единицы">
            ${cardioRepsCol} <span class="th-swap-icon">⇄</span>
          </button>
          <span class="sh-param-col">${cardioParamCol}</span>
        ` : `
          <span class="sh-weight">КГ</span>
          <span class="sh-reps">${isTimed ? "СЕК" : "ПОВТ"}</span>
        `}
        <span class="sh-check">ГОТОВО</span>
        <span class="sh-del"></span>
      </div>

      <div class="sets-list-rows" id="sets-list-${exIndex}"></div>

      <button type="button" class="btn-add-set" id="btn-add-set-${exIndex}">
        ${isCardio ? "+ Добавить отрезок" : "+ Добавить подход"}
      </button>
    `;

    // Интерактивное переключение единиц по клику в шапке
    if (isCardio && window.CardioHelper) {
      const btnMain = card.querySelector(`#th-toggle-main-${exIndex}`);
      if (btnMain) {
        btnMain.addEventListener("click", (e) => {
          e.stopPropagation();
          if (ex.cardioMode === "time") {
            window.CardioHelper.cycleTimeUnit(ex);
          } else {
            window.CardioHelper.cycleDistanceUnit(ex);
          }
          syncToTemplate();
          onSaveSession();
          onRerender();
        });
      }

      const btnSub = card.querySelector(`#th-toggle-sub-${exIndex}`);
      if (btnSub) {
        btnSub.addEventListener("click", (e) => {
          e.stopPropagation();
          if (ex.cardioMode === "time") {
            window.CardioHelper.cycleDistanceUnit(ex);
          } else {
            window.CardioHelper.cycleTimeUnit(ex);
          }
          syncToTemplate();
          onSaveSession();
          onRerender();
        });
      }
    }

    // Редактирование заметки на лету
    const tipEl = card.querySelector(".ex-tip-box");
    tipEl.addEventListener("blur", () => {
      ex.tip = tipEl.textContent.trim();
      onSaveSession();
    });

    // Смена порядка: вверх
    card.querySelector(".btn-move-up").addEventListener("click", () => {
      if (exIndex > 0) {
        const temp = workout.exercises[exIndex];
        workout.exercises[exIndex] = workout.exercises[exIndex - 1];
        workout.exercises[exIndex - 1] = temp;
        syncToTemplate();
        onSaveSession();
        onRerender();
      }
    });

    // Смена порядка: вниз
    card.querySelector(".btn-move-down").addEventListener("click", () => {
      if (exIndex < workout.exercises.length - 1) {
        const temp = workout.exercises[exIndex];
        workout.exercises[exIndex] = workout.exercises[exIndex + 1];
        workout.exercises[exIndex + 1] = temp;
        syncToTemplate();
        onSaveSession();
        onRerender();
      }
    });

    // Замена упражнения на другое
    card.querySelector(".btn-replace-ex").addEventListener("click", () => {
      window.ModalsModule.openAddExerciseModal((replacementEx) => {
        const isRepCardio = window.CardioHelper ? window.CardioHelper.isCardioExercise(replacementEx) : Boolean(replacementEx.isCardio || replacementEx.category === "Бег" || replacementEx.category === "Эллипс" || replacementEx.category === "Вело");
        const lastSets = window.StorageModule.getLastPerformance(replacementEx.id, replacementEx.name);
        const exPR = window.StorageModule.getExercisePR(replacementEx.id, replacementEx.name);
        const isBodyweight = Boolean(
          replacementEx.equip === "Свой вес" || 
          replacementEx.category === "Пресс" || 
          replacementEx.defaultWeight === 0
        );

        const prevSetsCount = ex.sets.length || 3;
        const newSets = [];

        for (let s = 1; s <= prevSetsCount; s++) {
          const prevSet = lastSets && lastSets[s - 1] ? lastSets[s - 1] : (lastSets && lastSets[0] ? lastSets[0] : null);
          if (isRepCardio) {
            const dist = prevSet && prevSet.distance !== undefined ? prevSet.distance : (replacementEx.defaultDistance || 0.4);
            const pace = prevSet && prevSet.time ? prevSet.time : (replacementEx.defaultPace || "04:20");
            newSets.push({
              setNumber: s,
              distance: dist,
              time: pace,
              minutes: replacementEx.targetMinutes || 20,
              incline: replacementEx.incline != null ? replacementEx.incline : 1,
              level: replacementEx.resistanceLevel != null ? replacementEx.resistanceLevel : 5,
              completed: false,
              prevInfo: prevSet ? `${prevSet.distance || ''} км (${prevSet.time || ''})` : null
            });
          } else {
            let baseWeight = isBodyweight ? 0 : 20;
            if (prevSet && prevSet.weight !== undefined) {
              baseWeight = prevSet.weight;
            } else if (!isBodyweight && exPR && exPR.weight > 0) {
              baseWeight = exPR.weight;
            } else if (replacementEx.defaultWeight !== undefined) {
              baseWeight = isBodyweight ? 0 : replacementEx.defaultWeight;
            }
            const baseReps = prevSet && prevSet.reps ? prevSet.reps : (parseInt(replacementEx.targetReps) || 8);
            newSets.push({
              setNumber: s,
              weight: baseWeight,
              reps: baseReps,
              completed: false,
              prevInfo: prevSet ? `${prevSet.weight}×${prevSet.reps}` : (exPR && exPR.weight ? `PR:${exPR.weight}` : null)
            });
          }
        }

        workout.exercises[exIndex] = {
          ...replacementEx,
          sets: newSets
        };

        syncToTemplate();
        onSaveSession();
        onRerender();
      });
    });

    // Настройка упражнения
    card.querySelector(".btn-edit-ex").addEventListener("click", () => {
      window.ModalsModule.openEditExerciseModal(ex, () => {
        syncToTemplate();
        onSaveSession();
        onRerender();
      });
    });

    // Удаление упражнения
    card.querySelector(".btn-del-ex").addEventListener("click", () => {
      if (confirm(`Удалить упражнение «${ex.name}»?`)) {
        workout.exercises.splice(exIndex, 1);
        syncToTemplate();
        onSaveSession();
        onRerender();
      }
    });

    // Добавление подхода
    card.querySelector(`#btn-add-set-${exIndex}`).addEventListener("click", () => {
      const lastSet = ex.sets[ex.sets.length - 1];
      if (isCardio) {
        const isTimeMode = ex.cardioMode === "time";
        const meta = window.CardioHelper ? window.CardioHelper.getCardioParamMeta(ex) : { prop: 'incline', defaultVal: 1 };
        const defaultDist = (ex.distUnit === "m") ? 400 : 0.4;
        ex.sets.push({
          setNumber: ex.sets.length + 1,
          distance: lastSet && lastSet.distance !== undefined ? lastSet.distance : (ex.defaultDistance || defaultDist),
          time: lastSet && lastSet.time ? lastSet.time : (isTimeMode ? (ex.timeUnit === "sec" ? "60 сек" : `${ex.targetMinutes || 20} мин`) : (ex.timeUnit === "sec" ? "90" : (ex.defaultPace || "04:20"))),
          minutes: lastSet && lastSet.minutes ? lastSet.minutes : (ex.targetMinutes || 20),
          seconds: lastSet && lastSet.seconds ? lastSet.seconds : 60,
          incline: lastSet && lastSet.incline != null ? lastSet.incline : (ex.incline != null ? ex.incline : 1),
          level: lastSet && lastSet.level != null ? lastSet.level : (ex[meta.prop] != null ? ex[meta.prop] : meta.defaultVal),
          bikeLevel: lastSet && lastSet.bikeLevel != null ? lastSet.bikeLevel : (ex.bikeLevel != null ? ex.bikeLevel : 5),
          completed: false,
          prevInfo: null
        });
      } else {
        const exPR = window.StorageModule.getExercisePR(ex.id, ex.name);
        let setW = 20;
        if (lastSet && lastSet.weight !== undefined) {
          setW = lastSet.weight;
        } else if (exPR && exPR.weight > 0) {
          setW = exPR.weight;
        } else if (ex.defaultWeight !== undefined) {
          setW = ex.defaultWeight;
        }
        ex.sets.push({
          setNumber: ex.sets.length + 1,
          weight: setW,
          reps: lastSet ? lastSet.reps : (parseInt(ex.targetReps) || 8),
          completed: false,
          prevInfo: null
        });
      }
      syncToTemplate();
      onSaveSession();
      onRerender();
    });

    // Рендер строк подходов
    const rowsContainer = card.querySelector(`#sets-list-${exIndex}`);
    ex.sets.forEach((set, setIndex) => {
      const row = document.createElement("div");
      row.className = `set-item-row ${set.completed ? "done" : ""}`;

      if (isCardio) {
        if (window.CardioHelper) {
          window.CardioHelper.renderCardioSetRow(
            row, set, setIndex, ex, workout,
            onSaveSession, onTriggerRest, onRerender, onStartTimer, sessionStartTime,
            { syncToTemplate, onFinish, onUpdateTopNav: updateTopNav }
          );
        }
      } else {
        renderStrengthSetRow(
          row, set, setIndex, ex, workout, isTimed,
          onSaveSession, onTriggerRest, onRerender, onStartTimer, sessionStartTime,
          { syncToTemplate, onFinish, onUpdateTopNav: updateTopNav }
        );
      }

      rowsContainer.appendChild(row);
    });

    container.appendChild(card);
  });

  // Кнопка добавления упражнения внизу тренировки
  const addExBox = document.createElement("div");
  addExBox.className = "add-exercise-box";
  addExBox.innerHTML = `
    <button type="button" class="btn-add-exercise" id="btn-open-add-ex">
      + Добавить упражнение (из базы или свое)
    </button>
  `;

  addExBox.querySelector("#btn-open-add-ex").addEventListener("click", () => {
    window.ModalsModule.openAddExerciseModal((newEx) => {
      const isCardio = window.CardioHelper ? window.CardioHelper.isCardioExercise(newEx) : Boolean(newEx.isCardio || newEx.category === "Бег" || newEx.category === "Эллипс" || newEx.category === "Вело");
      const lastSets = window.StorageModule.getLastPerformance(newEx.id, newEx.name);
      const exPR = window.StorageModule.getExercisePR(newEx.id, newEx.name);
      const isBodyweight = Boolean(
        newEx.equip === "Свой вес" || 
        newEx.category === "Пресс" || 
        newEx.defaultWeight === 0
      );

      const initialSets = [];
      const count = newEx.setsCount || (newEx.sets ? newEx.sets.length : 3);
      const meta = window.CardioHelper ? window.CardioHelper.getCardioParamMeta(newEx) : { prop: 'incline', defaultVal: 1 };
      const defaultDist = (newEx.distUnit === "m") ? 400 : 0.4;
      for (let s = 1; s <= count; s++) {
        const prevSet = lastSets && lastSets[s - 1] ? lastSets[s - 1] : (lastSets && lastSets[0] ? lastSets[0] : null);

        if (isCardio) {
          const dist = prevSet && prevSet.distance !== undefined ? prevSet.distance : (newEx.defaultDistance || defaultDist);
          const pace = prevSet && prevSet.time ? prevSet.time : (newEx.defaultPace || (newEx.timeUnit === "sec" ? "90" : "04:20"));
          initialSets.push({
            setNumber: s,
            distance: dist,
            time: pace,
            minutes: newEx.targetMinutes || 20,
            seconds: 60,
            incline: newEx.incline != null ? newEx.incline : 1,
            level: newEx.resistanceLevel != null ? newEx.resistanceLevel : 5,
            bikeLevel: newEx.bikeLevel != null ? newEx.bikeLevel : 5,
            completed: false,
            prevInfo: prevSet ? `${prevSet.distance || ''} ${newEx.distUnit === 'm' ? 'м' : 'км'} (${prevSet.time || ''})` : null
          });
        } else {
          let baseWeight = isBodyweight ? 0 : 20;
          if (prevSet && prevSet.weight !== undefined) {
            baseWeight = prevSet.weight;
          } else if (!isBodyweight && exPR && exPR.weight > 0) {
            baseWeight = exPR.weight;
          } else if (newEx.defaultWeight !== undefined) {
            baseWeight = isBodyweight ? 0 : newEx.defaultWeight;
          }
          const baseReps = prevSet && prevSet.reps ? prevSet.reps : (parseInt(newEx.targetReps) || 8);
          initialSets.push({
            setNumber: s,
            weight: baseWeight,
            reps: baseReps,
            completed: false,
            prevInfo: prevSet ? `${prevSet.weight}×${prevSet.reps}` : (exPR && exPR.weight ? `PR:${exPR.weight}` : null)
          });
        }
      }
      workout.exercises.push({
        ...newEx,
        sets: initialSets
      });
      syncToTemplate();
      onSaveSession();
      onRerender();
    });
  });

  container.appendChild(addExBox);
}

// Рендер силового подхода через модуль strength-row.js
function renderStrengthSetRow(...args) {
  if (window.StrengthRow && window.StrengthRow.renderStrengthSetRow) {
    return window.StrengthRow.renderStrengthSetRow(...args);
  }
}

window.WorkoutView = {
  renderWorkoutView
};

