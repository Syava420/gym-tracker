// Модуль ручного внесения тренировки в выбранный день календаря
// Позволяет указать упражнения, пиковый вес и количество подходов

/**
 * Модальное окно ручного внесения тренировки в выбранный день
 * @param {string} dateKey - Дата в формате YYYY-MM-DD
 * @param {Function} onSaved - Callback после успешного сохранения
 */
function openManualWorkoutModal(dateKey, onSaved) {
  let modal = document.getElementById("manual-workout-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "manual-workout-modal";
    modal.className = "modal-overlay";
    document.body.appendChild(modal);
  }

  const routines = window.StorageModule.getWorkoutRoutines();
  const dateFormatted = dateKey.split("-").reverse().join(".");

  let manualExercises = [];

  const populateFromRoutine = (routineId) => {
    manualExercises = [];
    if (routineId !== "custom") {
      const found = routines.find((r) => r.id === routineId);
      if (found && found.exercises) {
        manualExercises = found.exercises.map((ex) => ({
          name: ex.name,
          peakWeight: ex.defaultWeight || 20,
          setsCount: ex.setsCount || (ex.sets ? ex.sets.length : 3),
          reps: parseInt(ex.targetReps) || 8
        }));
      }
    }
  };

  const renderModalUI = () => {
    modal.innerHTML = `
      <div class="modal-card">
        <div class="modal-header">
          <span class="modal-title">Закрыть день (${dateFormatted})</span>
          <button type="button" class="modal-close" id="manual-close-btn">✕</button>
        </div>

        <div class="form-group">
          <label class="form-label">Шаблон тренировки</label>
          <select id="manual-routine-select" class="form-input">
            <option value="custom">Своя тренировка (ввести вручную)</option>
            ${routines.map((r) => `<option value="${r.id}">${r.title}</option>`).join("")}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Название тренировки</label>
          <input type="text" id="manual-title-input" class="form-input" value="Силовая тренировка">
        </div>

        <div class="form-group" style="display:flex; gap:10px;">
          <div style="flex:1;">
            <label class="form-label">Время (мин.)</label>
            <input type="number" id="manual-duration-input" class="form-input" value="60" min="5" step="5">
          </div>
        </div>

        <div class="form-group">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <label class="form-label" style="margin-bottom:0;">Упражнения, пиковый вес и подходы:</label>
            <button type="button" class="btn-text-action" id="btn-add-manual-ex" style="font-size:11px; padding:0;">+ Упражнение</button>
          </div>
          <div class="manual-ex-box" id="manual-ex-container">
            ${manualExercises.length === 0 ? '<div style="font-size:11px; color:#666; padding:8px 0;">Нажмите «+ Упражнение» выше или выберите шаблон с готовыми упражнениями.</div>' : ""}
            ${manualExercises.map((ex, idx) => `
              <div class="manual-ex-item" data-index="${idx}">
                <div class="manual-ex-header">
                  <input type="text" class="manual-ex-name-input" value="${ex.name}" placeholder="Название упражнения">
                  <button type="button" class="btn-card-tool btn-remove-manual-ex" title="Удалить" style="color:#ef4444; width:24px; height:24px; padding:0;">✕</button>
                </div>
                <div class="manual-ex-controls">
                  <span>Пиковый вес:</span>
                  <input type="number" class="manual-ex-input-num manual-ex-weight" value="${ex.peakWeight}" min="0" step="2.5"> кг
                  <span style="margin-left:8px;">Подходов:</span>
                  <input type="number" class="manual-ex-input-num manual-ex-sets" value="${ex.setsCount}" min="1">
                  <span style="margin-left:8px;">Повт:</span>
                  <input type="number" class="manual-ex-input-num manual-ex-reps" value="${ex.reps}" min="1">
                </div>
              </div>
            `).join("")}
          </div>
        </div>

        <div class="modal-actions" style="margin-top: 14px;">
          <button type="button" id="manual-save-btn" class="btn-primary-full">Записать тренировку в этот день</button>
        </div>
      </div>
    `;

    modal.classList.add("visible");

    modal.querySelector("#manual-close-btn").addEventListener("click", () => {
      modal.classList.remove("visible");
    });

    const selectEl = modal.querySelector("#manual-routine-select");
    const titleInput = modal.querySelector("#manual-title-input");

    selectEl.addEventListener("change", () => {
      const val = selectEl.value;
      if (val === "custom") {
        titleInput.value = "Силовая тренировка";
        manualExercises = [];
      } else {
        const found = routines.find((r) => r.id === val);
        if (found) {
          titleInput.value = found.title;
          populateFromRoutine(val);
        }
      }
      renderModalUI();
      const newSelect = modal.querySelector("#manual-routine-select");
      if (newSelect) newSelect.value = val;
    });

    // Добавление нового упражнения
    modal.querySelector("#btn-add-manual-ex").addEventListener("click", () => {
      syncExerciseInputs();
      manualExercises.push({
        name: "Жим штанги лежа",
        peakWeight: 60,
        setsCount: 3,
        reps: 8
      });
      renderModalUI();
    });

    // Удаление упражнения
    modal.querySelectorAll(".btn-remove-manual-ex").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        syncExerciseInputs();
        const row = e.target.closest(".manual-ex-item");
        const idx = parseInt(row.dataset.index);
        manualExercises.splice(idx, 1);
        renderModalUI();
      });
    });

    // Сохранение
    modal.querySelector("#manual-save-btn").addEventListener("click", () => {
      syncExerciseInputs();
      const title = titleInput.value.trim() || "Тренировка";
      const duration = parseInt(modal.querySelector("#manual-duration-input").value) || 60;

      let totalSetsCount = 0;
      let totalVolume = 0;
      const formattedExercises = [];

      manualExercises.forEach((item) => {
        const exName = item.name.trim() || "Упражнение";
        const weight = parseFloat(item.peakWeight) || 0;
        const setsNum = parseInt(item.setsCount) || 3;
        const repsNum = parseInt(item.reps) || 8;

        const sets = [];
        for (let s = 1; s <= setsNum; s++) {
          sets.push({
            setNumber: s,
            weight: weight,
            reps: repsNum,
            completed: true
          });
          totalSetsCount++;
          totalVolume += (weight * repsNum);
        }

        formattedExercises.push({
          name: exName,
          sets: sets
        });

        // Сохраняем рекорд, если вес больше текущего
        if (weight > 0) {
          const key = exName.toLowerCase().trim();
          const curPR = window.StorageModule.getExercisePR(null, exName);
          if (!curPR || !curPR.weight || weight > curPR.weight) {
            window.StorageModule.saveCustomPR(key, {
              name: exName,
              weight: weight,
              reps: repsNum,
              updatedAt: new Date().toISOString()
            });
          }
        }
      });

      if (formattedExercises.length === 0) {
        formattedExercises.push({
          name: title,
          sets: [{ setNumber: 1, weight: 0, reps: 10, completed: true }]
        });
        totalSetsCount = 1;
      }

      window.StorageModule.addManualWorkoutToDate(dateKey, {
        title,
        durationMinutes: duration,
        completedSetsCount: totalSetsCount,
        totalVolumeKg: Math.round(totalVolume),
        exercises: formattedExercises
      });

      // Синхронизируем программу в общий список тренировок, чтобы она отображалась на главном экране!
      try {
        const allRoutines = window.StorageModule.getWorkoutRoutines();
        let routine = allRoutines.find((r) => r.id === selectedRoutineId || (r.title && r.title.toLowerCase().trim() === title.toLowerCase().trim()));
        const mappedTemplateExercises = formattedExercises.map((fe) => ({
          id: "ex_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
          name: fe.name,
          category: "Силовые",
          equip: "Снаряд",
          targetReps: fe.sets && fe.sets[0] ? String(fe.sets[0].reps || 8) : "8",
          defaultWeight: fe.sets && fe.sets[0] ? fe.sets[0].weight : 20,
          setsCount: fe.sets ? fe.sets.length : 3,
          isCardio: false,
          tip: ""
        }));

        if (routine) {
          routine.exercises = mappedTemplateExercises;
          window.StorageModule.saveWorkoutRoutines(allRoutines);
        } else if (title && title.trim()) {
          allRoutines.push({
            id: "routine_" + Date.now(),
            title: title.trim(),
            subtitle: "Тренировка",
            tag: "ТР",
            folder: "Все",
            exercises: mappedTemplateExercises
          });
          window.StorageModule.saveWorkoutRoutines(allRoutines);
        }
      } catch (e) {
        console.error("Ошибка сохранения шаблона:", e);
      }

      modal.classList.remove("visible");
      if (onSaved) onSaved();
    });
  };

  const syncExerciseInputs = () => {
    const items = modal.querySelectorAll(".manual-ex-item");
    items.forEach((row) => {
      const idx = parseInt(row.dataset.index);
      if (manualExercises[idx]) {
        manualExercises[idx].name = row.querySelector(".manual-ex-name-input").value;
        manualExercises[idx].peakWeight = parseFloat(row.querySelector(".manual-ex-weight").value) || 0;
        manualExercises[idx].setsCount = parseInt(row.querySelector(".manual-ex-sets").value) || 1;
        manualExercises[idx].reps = parseInt(row.querySelector(".manual-ex-reps").value) || 1;
      }
    });
  };

  renderModalUI();
}

window.ManualWorkoutModal = {
  openManualWorkoutModal
};
