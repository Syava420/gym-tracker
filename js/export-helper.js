// Модуль выгрузки дневника тренировок в блокнот (Windows Notepad .txt)

/**
 * Генерация понятного структурированного текста дневника для блокнота (Windows Notepad)
 */
function generateTextDiary() {
  const stats = window.StorageModule.getOverallStats();
  const history = window.StorageModule.getWorkoutHistory().filter((w) => w.completedSetsCount > 0);
  const userPRs = window.StorageModule.getAllUserPRs();

  // Хронологическая сортировка тренировок от старых к новым
  const sorted = history.slice().sort((a, b) => {
    const da = a.dateKey || a.completedAt || "";
    const db = b.dateKey || b.completedAt || "";
    return da.localeCompare(db);
  });

  let txt = "==================================================\n";
  txt += "        ДНЕВНИК ТРЕНИРОВОК HYPER-MASS\n";
  txt += "==================================================\n";
  txt += `Всего тренировочных дней: ${stats.uniqueDays}\n`;
  txt += `Всего тренировок: ${stats.totalWorkouts}\n`;
  txt += `Общее затраченное время: ${stats.timeFormatted}\n`;
  txt += `Общий поднятый тоннаж: ${stats.totalVolumeKg.toLocaleString("ru-RU")} кг\n`;
  if (stats.totalDistanceKm > 0) {
    txt += `Общая дистанция бега: ${stats.totalDistanceKm} км\n`;
  }
  txt += `Дата выгрузки: ${new Date().toLocaleDateString("ru-RU")}\n`;
  txt += "==================================================\n\n";

  // Сбор всех упражнений, пиковых весов и количества подходов
  const exSummary = {};

  // 1. Из истории выполненных тренировок
  sorted.forEach((w) => {
    (w.exercises || []).forEach((ex) => {
      if (!ex.name) return;
      const key = ex.name.toLowerCase().trim();
      if (!exSummary[key]) {
        exSummary[key] = {
          name: ex.name,
          peakWeight: 0,
          peakReps: 0,
          totalSets: 0,
          isCardio: Boolean(ex.isCardio),
          maxDistance: 0,
          bestTime: ""
        };
      }

      (ex.sets || []).forEach((s) => {
        if (s.completed !== false) {
          exSummary[key].totalSets++;
          const wt = parseFloat(s.weight) || 0;
          const rp = parseInt(s.reps) || 0;
          if (wt > exSummary[key].peakWeight || (wt === exSummary[key].peakWeight && rp > exSummary[key].peakReps)) {
            exSummary[key].peakWeight = wt;
            exSummary[key].peakReps = rp;
          }
          const dst = parseFloat(s.distance) || 0;
          if (dst > exSummary[key].maxDistance) {
            exSummary[key].maxDistance = dst;
            exSummary[key].bestTime = s.time || "";
          }
        }
      });
    });
  });

  // 2. Дополняем данными из личных рекордов (PR)
  userPRs.forEach((pr) => {
    if (!pr.name) return;
    const key = pr.name.toLowerCase().trim();
    if (!exSummary[key]) {
      exSummary[key] = {
        name: pr.name,
        peakWeight: pr.weight || 0,
        peakReps: pr.reps || 1,
        totalSets: 0,
        isCardio: Boolean(pr.distance > 0),
        maxDistance: pr.distance || 0,
        bestTime: pr.time || ""
      };
    } else {
      if (pr.weight > exSummary[key].peakWeight) {
        exSummary[key].peakWeight = pr.weight;
        exSummary[key].peakReps = pr.reps || 1;
      }
      if (pr.distance > exSummary[key].maxDistance) {
        exSummary[key].maxDistance = pr.distance;
        exSummary[key].bestTime = pr.time || "";
      }
    }
  });

  // СЕКЦИЯ 1: Сводка по упражнениям и пиковым весам
  txt += "--------------------------------------------------\n";
  txt += "  СВОДКА УПРАЖНЕНИЙ, ПИКОВЫЕ ВЕСА И ПОДХОДЫ:\n";
  txt += "--------------------------------------------------\n";
  const exKeys = Object.keys(exSummary);
  if (exKeys.length === 0) {
    txt += "Упражнений пока не зафиксировано.\n\n";
  } else {
    exKeys.sort().forEach((k) => {
      const item = exSummary[k];
      if (item.isCardio || item.maxDistance > 0) {
        txt += `• ${item.name}:\n`;
        txt += `  - Пиковая дистанция: ${item.maxDistance} км ${item.bestTime ? `(${item.bestTime})` : ""}\n`;
        if (item.totalSets > 0) {
          txt += `  - Всего выполнено отрезков: ${item.totalSets}\n`;
        }
      } else {
        const wtStr = item.peakWeight > 0 ? `${item.peakWeight} кг` : "Свой вес";
        const repsStr = item.peakReps > 0 ? ` (на ${item.peakReps} повт.)` : "";
        txt += `• ${item.name}:\n`;
        txt += `  - Пиковый вес: ${wtStr}${repsStr}\n`;
        if (item.totalSets > 0) {
          txt += `  - Всего выполнено подходов: ${item.totalSets}\n`;
        }
      }
    });
    txt += "\n";
  }

  // СЕКЦИЯ 2: Хронологический журнал тренировок
  txt += "==================================================\n";
  txt += "  ПОДРОБНЫЙ ЖУРНАЛ ТРЕНИРОВОК ПО ДНЯМ:\n";
  txt += "==================================================\n\n";

  if (sorted.length === 0) {
    txt += "Тренировок пока не зафиксировано.\n";
    txt += "(После завершения тренировок здесь появится детальная запись с каждым упражнением, пиковым весом и выполненными подходами.)\n\n";
    txt += "Пример формата записи:\n";
    txt += "[1] 29.09.2026 — Верх А\n";
    txt += "Длительность: 55 мин. | Тоннаж: 4 200 кг | Всего подходов: 18\n";
    txt += "Упражнения:\n";
    txt += "  1. Жим штанги лежа на горизонтальной скамье\n";
    txt += "     • Пиковый вес: 80 кг (на 6 повт.)\n";
    txt += "     • Подходы (3): 1) 60 кг × 10  2) 70 кг × 8  3) 80 кг × 6\n";
    txt += "  2. Тяга гантели в наклоне с упором о скамью\n";
    txt += "     • Пиковый вес: 16 кг (на 10 повт.)\n";
    txt += "     • Подходы (3): 1) 14 кг × 10  2) 16 кг × 10  3) 16 кг × 8\n";
    return txt;
  }

  sorted.forEach((w, idx) => {
    const date = w.dateKey
      ? w.dateKey.split("-").reverse().join(".")
      : (w.completedAt ? w.completedAt.split("T")[0].split("-").reverse().join(".") : "—");

    txt += `[${idx + 1}] ${date} — ${w.title}\n`;
    txt += `Длительность: ${w.durationMinutes || 0} мин.`;
    if (w.totalVolumeKg) txt += ` | Тоннаж: ${w.totalVolumeKg.toLocaleString("ru-RU")} кг`;
    if (w.totalDistanceKm) txt += ` | Дистанция: ${w.totalDistanceKm} км`;
    txt += ` | Всего подходов: ${w.completedSetsCount || 0}\n`;

    if (w.exercises && w.exercises.length > 0) {
      txt += "Упражнения:\n";
      w.exercises.forEach((ex, exIdx) => {
        const completedSets = (ex.sets || []).filter((s) => s.completed !== false);
        if (completedSets.length === 0) return;

        const isCardio = Boolean(ex.isCardio || completedSets.some((s) => s.distance !== undefined));

        if (isCardio) {
          let maxDist = 0;
          let bestTime = "";
          completedSets.forEach((s) => {
            const d = parseFloat(s.distance) || 0;
            if (d > maxDist) {
              maxDist = d;
              bestTime = s.time || "";
            }
          });
          const setsList = completedSets.map((s, si) => `${si + 1}) ${s.distance} км (${s.time || ""})`).join("  ");
          txt += `  ${exIdx + 1}. ${ex.name}\n`;
          txt += `     • Пиковая дистанция: ${maxDist} км ${bestTime ? `(${bestTime})` : ""}\n`;
          txt += `     • Отрезки (${completedSets.length}): ${setsList}\n`;
        } else {
          let maxW = 0;
          let maxR = 0;
          completedSets.forEach((s) => {
            const wt = parseFloat(s.weight) || 0;
            const rp = parseInt(s.reps) || 0;
            if (wt > maxW || (wt === maxW && rp > maxR)) {
              maxW = wt;
              maxR = rp;
            }
          });
          const setsList = completedSets.map((s, si) => {
            if (s.weight > 0) return `${si + 1}) ${s.weight} кг × ${s.reps}`;
            return `${si + 1}) ${s.reps} повт.`;
          }).join("  ");
          txt += `  ${exIdx + 1}. ${ex.name}\n`;
          const peakStr = maxW > 0 ? `${maxW} кг (на ${maxR} повт.)` : `Свой вес (${maxR} повт.)`;
          txt += `     • Пиковый вес: ${peakStr}\n`;
          txt += `     • Подходы (${completedSets.length}): ${setsList}\n`;
        }
      });
    }
    txt += "--------------------------------------------------\n\n";
  });

  return txt;
}

/**
 * Модальное окно выгрузки текста для блокнота
 */
function openTextExportModal() {
  let modal = document.getElementById("text-export-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "text-export-modal";
    modal.className = "modal-overlay";
    document.body.appendChild(modal);
  }

  const renderModal = () => {
    const diaryText = generateTextDiary();

    modal.innerHTML = `
      <div class="modal-card">
        <div class="modal-header">
          <span class="modal-title">Выгрузка в блокнот (.txt)</span>
          <button type="button" class="modal-close" id="export-text-close">✕</button>
        </div>

        <div class="form-group" style="flex: 1; display: flex; flex-direction: column;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <label class="form-label" style="margin-bottom: 0;">Текст дневника (можно редактировать и дописывать):</label>
            <button type="button" class="btn-text-action" id="btn-refresh-diary-text" title="Перегенерировать из журнала" style="font-size: 11px; padding: 0;">Обновить</button>
          </div>
          <textarea id="diary-textarea" class="diary-export-area" spellcheck="false">${diaryText}</textarea>
        </div>

        <div class="modal-actions" style="gap: 8px; display: flex; margin-top: 10px;">
          <button type="button" id="btn-copy-diary" class="btn-primary-dark" style="flex: 1;">Скопировать</button>
          <button type="button" id="btn-download-diary" class="btn-secondary-dark" style="flex: 1;">Скачать .txt</button>
        </div>
      </div>
    `;

    modal.classList.add("visible");

    modal.querySelector("#export-text-close").addEventListener("click", () => {
      modal.classList.remove("visible");
    });

    // Перегенерация текста
    modal.querySelector("#btn-refresh-diary-text").addEventListener("click", () => {
      const textarea = modal.querySelector("#diary-textarea");
      textarea.value = generateTextDiary();
    });

    // Копирование в буфер
    const copyBtn = modal.querySelector("#btn-copy-diary");
    copyBtn.addEventListener("click", () => {
      const textarea = modal.querySelector("#diary-textarea");
      textarea.select();
      const textToCopy = textarea.value;
      try {
        navigator.clipboard.writeText(textToCopy).then(() => {
          copyBtn.textContent = "Скопировано!";
          setTimeout(() => { copyBtn.textContent = "Скопировать"; }, 2000);
        }).catch(() => {
          document.execCommand("copy");
          copyBtn.textContent = "Скопировано!";
          setTimeout(() => { copyBtn.textContent = "Скопировать"; }, 2000);
        });
      } catch (e) {
        document.execCommand("copy");
        copyBtn.textContent = "Скопировано!";
        setTimeout(() => { copyBtn.textContent = "Скопировать"; }, 2000);
      }
    });

    // Скачивание .txt файла
    modal.querySelector("#btn-download-diary").addEventListener("click", () => {
      const textarea = modal.querySelector("#diary-textarea");
      const currentText = textarea ? textarea.value : diaryText;
      const blob = new Blob([currentText], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `gym_diary_${new Date().toISOString().split("T")[0]}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  renderModal();
}

// Прокси на модалку ручного внесения тренировки для обратной совместимости
function openManualWorkoutModal(dateKey, onSaved) {
  if (window.ManualWorkoutModal && window.ManualWorkoutModal.openManualWorkoutModal) {
    window.ManualWorkoutModal.openManualWorkoutModal(dateKey, onSaved);
  }
}

window.ExportHelper = {
  generateTextDiary,
  openTextExportModal,
  openManualWorkoutModal
};
