// strength-row.js
// Модуль рендера строк силового подхода (вес, повторения, секундомер статики/виса, авто-завершение)

function renderStrengthSetRow(row, set, setIndex, ex, workout, isTimed, onSaveSession, onTriggerRest, onRerender, onStartTimer, sessionStartTime, options = {}) {
  const syncToTemplate = options.syncToTemplate || (() => {
    if (workout && workout.templateId && window.StorageModule && window.StorageModule.updateRoutineExercises) {
      window.StorageModule.updateRoutineExercises(workout.templateId, workout.exercises);
    }
  });

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
      <button type="button" class="btn-open-hang-timer ${isTimed ? "timed-accent" : ""}" title="Запустить секундомер удержания/виса"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M10 2h4"/></svg></button>
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

  // Таймер статики/виса/удержания
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
          if (options.onStartSessionTimer) options.onStartSessionTimer(Date.now());
          if (options.onUpdateTopNav) options.onUpdateTopNav();
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
      if (!sessionStartTime && onStartTimer) {
        onStartTimer(Date.now());
      }
      if (options.onStartSessionTimer) {
        options.onStartSessionTimer(Date.now());
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
    if (options.onUpdateTopNav) options.onUpdateTopNav();
    onSaveSession();

    if (set.completed) {
      if (ex.restSeconds > 0) onTriggerRest(ex.restSeconds);

      // Проверка авто-завершения тренировки
      let totalSets = 0;
      let doneSets = 0;
      (workout.exercises || []).forEach((eItem) => {
        (eItem.sets || []).forEach((s) => {
          totalSets++;
          if (s.completed) doneSets++;
        });
      });
      if (totalSets > 0 && doneSets === totalSets && options.onFinish) {
        setTimeout(() => {
          const msg = totalSets === 1
            ? "Подход выполнен! Завершить и сохранить тренировку?"
            : `Все подходы (${doneSets} из ${totalSets}) выполнены! Завершить тренировку?`;
          if (confirm(msg)) {
            syncToTemplate();
            options.onFinish();
          }
        }, 250);
      }
    }
  });

  row.querySelector(".btn-del-set-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    ex.sets.splice(setIndex, 1);
    ex.sets.forEach((s, idx) => { s.setNumber = idx + 1; });
    syncToTemplate();
    onSaveSession();
    onRerender();
  });
}

window.StrengthRow = { renderStrengthSetRow };
