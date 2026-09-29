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
  topNav.innerHTML = `
    <div class="workout-topbar-left">
      <button type="button" class="btn-back-text" id="btn-back-workout">← Выход</button>
      ${hasStarted ? `<button type="button" class="btn-cancel-mini" id="btn-cancel-workout" title="Сбросить тренировку">Сброс</button>` : ""}
    </div>
    <div class="workout-header-center">
      <div class="workout-header-title">${workout.title}</div>
      <div class="workout-header-timer" id="workout-stopwatch">${sessionStartTime ? "00:00" : "—"}</div>
    </div>
    ${canFinish ? `<button type="button" class="btn-finish-minimal" id="btn-finish-workout">Завершить</button>` : `<div style="width: 72px;"></div>`}
  `;

  topNav.querySelector("#btn-back-workout").addEventListener("click", onBack);
  const cancelBtn = topNav.querySelector("#btn-cancel-workout");
  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      if (confirm(`Сбросить и отменить тренировку «${workout.title}»? Данные не сохранятся.`)) {
        if (onCancel) onCancel();
      }
    });
  }
  const finishBtn = topNav.querySelector("#btn-finish-workout");
  if (finishBtn) {
    finishBtn.addEventListener("click", () => {
      syncToTemplate();
      onFinish();
    });
  }
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

    const isCardio = Boolean(ex.isCardio || ex.category === "Бег" || ex.category === "Эллипс");
    const videoUrl = ex.youtubeUrl || `https://www.youtube.com/results?search_query=${encodeURIComponent("техника " + ex.name)}`;
    const isTimed = !isCardio && ((ex.name && (ex.name.toLowerCase().includes("вис") || ex.name.toLowerCase().includes("планк") || ex.name.toLowerCase().includes("вакуум"))) || (ex.targetReps && String(ex.targetReps).includes("сек")));
    const exPR = window.StorageModule.getExercisePR(ex.id, ex.name);
    const prBadge = exPR && (exPR.weight > 0 || exPR.distance > 0)
      ? ` • <span class="pr-badge">Рекорд: ${exPR.weight ? exPR.weight + " кг" : exPR.distance + " км"}</span>`
      : "";

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
          ? `${ex.sets.length} отрезка • Цель: ${ex.targetReps || (ex.defaultDistance ? ex.defaultDistance + " км" : "Бег")} • Отдых ${window.TimerModule.formatTime(ex.restSeconds || 0)}`
          : `${ex.sets.length} подх. по ${ex.targetReps || "10-12"} • Отдых ${window.TimerModule.formatTime(ex.restSeconds != null ? ex.restSeconds : 60)} ${isTimed ? '• <span class="timed-badge">На время</span>' : ""}`
        }
        ${isCardio ? ' • <span class="run-badge">Кардио</span>' : ""}
        ${prBadge}
      </div>

      <div class="ex-tip-box" contenteditable="true" title="Кликни, чтобы изменить заметку">${ex.tip || "Нажми сюда, чтобы написать свою заметку"}</div>

      ${isCardio ? `<div class="cardio-controls-mount" id="cardio-controls-${exIndex}"></div>` : ""}

      <div class="sets-header-row ${isCardio ? "cardio-header" : ""}">
        <span class="sh-num">${isCardio ? "№" : "СЕТ"}</span>
        <span class="sh-prev">ПРЕД</span>
        <span class="sh-weight">${isCardio ? (ex.cardioMode === 'time' ? "ВРЕМЯ" : "ДИСТ (КМ)") : "КГ"}</span>
        <span class="sh-reps">${isCardio ? (ex.cardioMode === 'time' ? (window.CardioHelper && window.CardioHelper.getCardioType(ex) === 'ellipse' ? "ТЯЖЕСТЬ" : "УКЛОН") : "ТЕМП / ВРЕМЯ") : (isTimed ? "СЕК" : "ПОВТ")}</span>
        <span class="sh-check">ГОТОВО</span>
        <span class="sh-del"></span>
      </div>

      <div class="sets-list-rows" id="sets-list-${exIndex}"></div>

      <button type="button" class="btn-add-set" id="btn-add-set-${exIndex}">
        ${isCardio ? "+ Добавить отрезок" : "+ Добавить подход"}
      </button>
    `;

    // Монтирование панели управления кардио
    if (isCardio && window.CardioHelper) {
      const mount = card.querySelector(`#cardio-controls-${exIndex}`);
      if (mount) {
        window.CardioHelper.renderCardioControls(mount, ex, workout, onSaveSession, onRerender);
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
        const isRepCardio = Boolean(replacementEx.isCardio || replacementEx.category === "Бег" || replacementEx.category === "Эллипс");
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
        ex.sets.push({
          setNumber: ex.sets.length + 1,
          distance: lastSet && lastSet.distance !== undefined ? lastSet.distance : (ex.defaultDistance || 0.4),
          time: lastSet && lastSet.time ? lastSet.time : (isTimeMode ? `${ex.targetMinutes || 20} мин` : (ex.defaultPace || "04:20")),
          minutes: lastSet && lastSet.minutes ? lastSet.minutes : (ex.targetMinutes || 20),
          incline: lastSet && lastSet.incline != null ? lastSet.incline : (ex.incline != null ? ex.incline : 1),
          level: lastSet && lastSet.level != null ? lastSet.level : (ex.resistanceLevel != null ? ex.resistanceLevel : 5),
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
      onSaveSession();
      onRerender();
    });

    // Рендер строк подходов
    const rowsContainer = card.querySelector(`#sets-list-${exIndex}`);
    ex.sets.forEach((set, setIndex) => {
      const row = document.createElement("div");
      row.className = `set-item-row ${set.completed ? "done" : ""}`;

      if (isCardio) {
        // Беговой / Кардио подход через CardioHelper
        if (window.CardioHelper) {
          window.CardioHelper.renderCardioSetRow(row, set, setIndex, ex, workout, onSaveSession, onTriggerRest, onRerender, onStartTimer, sessionStartTime);
        }
      } else {
        // Силовой подход
        renderStrengthSetRow(row, set, setIndex, ex, workout, isTimed, onSaveSession, onTriggerRest, onRerender, onStartTimer, sessionStartTime);
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
      const isCardio = Boolean(newEx.isCardio || newEx.category === "Бег" || newEx.category === "Эллипс");
      const lastSets = window.StorageModule.getLastPerformance(newEx.id, newEx.name);
      const exPR = window.StorageModule.getExercisePR(newEx.id, newEx.name);
      const isBodyweight = Boolean(
        newEx.equip === "Свой вес" || 
        newEx.category === "Пресс" || 
        newEx.defaultWeight === 0
      );

      const initialSets = [];
      const count = newEx.setsCount || (newEx.sets ? newEx.sets.length : 3);
      for (let s = 1; s <= count; s++) {
        const prevSet = lastSets && lastSets[s - 1] ? lastSets[s - 1] : (lastSets && lastSets[0] ? lastSets[0] : null);

        if (isCardio) {
          const dist = prevSet && prevSet.distance !== undefined ? prevSet.distance : (newEx.defaultDistance || 0.4);
          const pace = prevSet && prevSet.time ? prevSet.time : (newEx.defaultPace || "04:20");
          initialSets.push({
            setNumber: s,
            distance: dist,
            time: pace,
            minutes: newEx.targetMinutes || 20,
            incline: newEx.incline != null ? newEx.incline : 1,
            level: newEx.resistanceLevel != null ? newEx.resistanceLevel : 5,
            completed: false,
            prevInfo: prevSet ? `${prevSet.distance || ''} км (${prevSet.time || ''})` : null
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

// Рендер силового подхода
function renderStrengthSetRow(row, set, setIndex, ex, workout, isTimed, onSaveSession, onTriggerRest, onRerender, onStartTimer, sessionStartTime) {
  row.innerHTML = `
    <div class="set-num-cell">
      <span class="set-index-badge">${set.setNumber}</span>
    </div>
    <div class="set-prev-cell">${set.prevInfo || "—"}</div>
    
    <div class="set-stepper-cell">
      <button type="button" class="btn-step btn-dec-w">-</button>
      <input type="number" class="step-input input-weight" value="${set.weight}" step="${ex.defaultWeight >= 40 ? 2.5 : 1}">
      <button type="button" class="btn-step btn-inc-w">+</button>
    </div>

    <div class="set-stepper-cell">
      <button type="button" class="btn-step btn-dec-r">-</button>
      <input type="number" class="step-input input-reps" value="${set.reps}" min="1">
      <button type="button" class="btn-step btn-inc-r">+</button>
      ${isTimed ? `<button type="button" class="btn-open-hang-timer" title="Запустить секундомер виса"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M10 2h4"/></svg></button>` : ""}
    </div>

    <div class="set-check-cell">
      <button type="button" class="btn-complete-set ${set.completed ? "active" : ""}">✓</button>
    </div>

    <div class="set-del-cell">
      <button type="button" class="btn-del-set-btn" title="Удалить подход">✕</button>
    </div>
  `;

  const inputW = row.querySelector(".input-weight");
  const inputR = row.querySelector(".input-reps");
  const btnCheck = row.querySelector(".btn-complete-set");
  const weightStep = ex.defaultWeight >= 40 ? 2.5 : 1;
  const exPR = window.StorageModule.getExercisePR(ex.id, ex.name);

  const updatePeakHighlight = () => {
    const isPeak = exPR && exPR.weight > 0 && set.weight >= exPR.weight;
    inputW.classList.toggle("peak-weight-highlight", Boolean(isPeak));
  };
  updatePeakHighlight();

  // Таймер статики/виса
  const hangBtn = row.querySelector(".btn-open-hang-timer");
  if (hangBtn) {
    hangBtn.addEventListener("click", () => {
      const targetSec = parseInt(inputR.value) || parseInt(ex.targetReps) || 40;
      window.StopwatchModal.openStaticTimerModal({
        title: ex.name,
        targetSeconds: targetSec,
        onSaveTime: (finalSec) => {
          set.reps = finalSec;
          inputR.value = finalSec;
          set.completed = true;
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
  }

  row.querySelector(".btn-dec-w").addEventListener("click", (e) => {
    e.stopPropagation();
    set.weight = Math.max(0, Math.round((set.weight - weightStep) * 10) / 10);
    inputW.value = set.weight;
    updatePeakHighlight();
    onSaveSession();
  });

  row.querySelector(".btn-inc-w").addEventListener("click", (e) => {
    e.stopPropagation();
    set.weight = Math.round((set.weight + weightStep) * 10) / 10;
    inputW.value = set.weight;
    updatePeakHighlight();
    onSaveSession();
  });

  inputW.addEventListener("change", () => {
    const val = parseFloat(inputW.value);
    set.weight = isNaN(val) ? 0 : val;
    updatePeakHighlight();
    onSaveSession();
  });

  row.querySelector(".btn-dec-r").addEventListener("click", (e) => {
    e.stopPropagation();
    set.reps = Math.max(1, set.reps - 1);
    inputR.value = set.reps;
    onSaveSession();
  });

  row.querySelector(".btn-inc-r").addEventListener("click", (e) => {
    e.stopPropagation();
    set.reps += 1;
    inputR.value = set.reps;
    onSaveSession();
  });

  inputR.addEventListener("change", () => {
    const val = parseInt(inputR.value);
    set.reps = isNaN(val) ? 1 : val;
    onSaveSession();
  });

  btnCheck.addEventListener("click", (e) => {
    e.stopPropagation();
    set.completed = !set.completed;
    if (set.completed) {
      set.completedAt = Date.now();
      // Первый выполненный подход официально запускает тренировку
      if (!sessionStartTime && onStartTimer) {
        onStartTimer(Date.now());
      }
      if (set.weight > 0 && (!exPR || !exPR.weight || set.weight > exPR.weight)) {
        window.StorageModule.saveCustomPR(ex.id || ex.name.toLowerCase().trim(), {
          name: ex.name,
          weight: set.weight,
          reps: set.reps,
          updatedAt: new Date().toISOString()
        });
        updatePeakHighlight();
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

  row.querySelector(".btn-del-set-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    ex.sets.splice(setIndex, 1);
    ex.sets.forEach((s, idx) => { s.setNumber = idx + 1; });
    onSaveSession();
    onRerender();
  });
}

window.WorkoutView = {
  renderWorkoutView
};

