// Модуль экрана "Журнал": полный месячный календарь, общая статистика дней и времени, закрытие дней и выгрузка в блокнот

let historyCalYear = new Date().getFullYear();
let historyCalMonth = new Date().getMonth();
let selectedHistoryDateKey = null;

function renderHistoryCalendarView(container) {
  container.innerHTML = "";

  const stats = window.StorageModule.getOverallStats();
  const history = window.StorageModule.getWorkoutHistory();

  // Группировка ТОЛЬКО РЕАЛЬНЫХ тренировок (исключаем пустые 0 подходов)
  const historyByDate = {};
  let monthWorkoutsCount = 0;
  let monthVolumeKg = 0;

  history.forEach((h) => {
    const hasSets = h.completedSetsCount && h.completedSetsCount > 0 && h.exercises && h.exercises.some((e) => e.sets && e.sets.length > 0);
    if (!hasSets) return;

    const key = h.dateKey || (h.completedAt ? h.completedAt.split("T")[0] : null);
    if (key) {
      if (!historyByDate[key]) historyByDate[key] = [];
      historyByDate[key].push(h);

      const d = new Date(key);
      if (d.getFullYear() === historyCalYear && d.getMonth() === historyCalMonth) {
        monthWorkoutsCount++;
        monthVolumeKg += (h.totalVolumeKg || 0);
      }
    }
  });

  const monthData = window.CalendarModule.getMonthGrid(historyCalYear, historyCalMonth);
  const todayKey = new Date().toISOString().split("T")[0];

  if (!selectedHistoryDateKey) {
    selectedHistoryDateKey = todayKey;
  }

  const wrapper = document.createElement("div");
  wrapper.className = "history-cal-wrapper";

  // Шапка общей статистики активности + шапка месяца
  wrapper.innerHTML = `
    <!-- Общая статистика: сколько дней занимается и сколько потратил времени -->
    <div class="calendar-overall-stats">
      <div class="cos-item">
        <span class="cos-num">${stats.uniqueDays}</span>
        <span class="cos-label">Дней в зале</span>
      </div>
      <div class="cos-item">
        <span class="cos-num">${stats.timeFormatted}</span>
        <span class="cos-label">Всего времени</span>
      </div>
      <div class="cos-item">
        <span class="cos-num">${stats.totalVolumeKg ? Math.round(stats.totalVolumeKg / 1000) + " т" : "0 т"}</span>
        <span class="cos-label">Тоннаж</span>
      </div>
    </div>

    <!-- Навигация по месяцам -->
    <div class="hist-month-nav">
      <button type="button" class="btn-month-nav" id="btn-prev-month">←</button>
      <div class="hist-month-center-box">
        <div class="hist-month-title">${monthData.monthName} ${monthData.year}</div>
        <div class="hist-month-stats">${monthWorkoutsCount} трен. • ${monthVolumeKg.toLocaleString("ru-RU")} кг</div>
      </div>
      <div class="hist-month-right-actions">
        <button type="button" class="btn-month-today" id="btn-month-today" title="Текущий месяц">Сегодня</button>
        <button type="button" class="btn-month-nav" id="btn-next-month">→</button>
      </div>
    </div>

    <div class="hist-grid-header">
      <span>ПН</span><span>ВТ</span><span>СР</span><span>ЧТ</span><span>ПТ</span><span>СБ</span><span>ВС</span>
    </div>

    <div class="hist-month-grid" id="hist-month-grid"></div>

    <!-- Детали выбранного дня с кнопкой закрытия дня -->
    <div class="hist-selected-details" id="hist-selected-details"></div>

    <!-- Кнопки выгрузки в блокнот и резервной копии -->
    <div class="history-export-actions">
      <button type="button" class="btn-primary-dark full-width" id="btn-hist-notepad-export">
        Выгрузить все тренировки в блокнот (TXT)
      </button>
      <button type="button" class="btn-secondary-dark full-width" id="btn-export-backup">
        Скачать резервную копию (JSON)
      </button>
    </div>
  `;

  // Кнопка "Сегодня"
  wrapper.querySelector("#btn-month-today").addEventListener("click", () => {
    historyCalYear = new Date().getFullYear();
    historyCalMonth = new Date().getMonth();
    selectedHistoryDateKey = todayKey;
    renderHistoryCalendarView(container);
  });

  // Выгрузка в блокнот
  wrapper.querySelector("#btn-hist-notepad-export").addEventListener("click", () => {
    window.ExportHelper.openTextExportModal();
  });

  // Экспорт JSON бэкапа
  wrapper.querySelector("#btn-export-backup").addEventListener("click", () => {
    const dataStr = window.StorageModule.exportAllData();
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gym_backup_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // Переключение месяцев
  wrapper.querySelector("#btn-prev-month").addEventListener("click", () => {
    historyCalMonth--;
    if (historyCalMonth < 0) {
      historyCalMonth = 11;
      historyCalYear--;
    }
    renderHistoryCalendarView(container);
  });

  wrapper.querySelector("#btn-next-month").addEventListener("click", () => {
    historyCalMonth++;
    if (historyCalMonth > 11) {
      historyCalMonth = 0;
      historyCalYear++;
    }
    renderHistoryCalendarView(container);
  });

  // Отрисовка дней месяца
  const gridEl = wrapper.querySelector("#hist-month-grid");
  monthData.cells.forEach((cell) => {
    if (cell.isEmpty) {
      const emptyDiv = document.createElement("div");
      emptyDiv.className = "hist-cell empty";
      gridEl.appendChild(emptyDiv);
      return;
    }

    const dayHasWorkouts = historyByDate[cell.dateKey] && historyByDate[cell.dateKey].length > 0;
    const isSelected = selectedHistoryDateKey === cell.dateKey;

    const cellDiv = document.createElement("div");
    cellDiv.className = `hist-cell ${cell.isToday ? "today" : ""} ${isSelected ? "selected" : ""} ${dayHasWorkouts ? "has-workout" : ""}`;
    cellDiv.innerHTML = `
      <span class="hist-cell-num">${cell.dayNum}</span>
      ${dayHasWorkouts ? '<span class="hist-workout-dot"></span>' : ""}
    `;

    cellDiv.addEventListener("click", () => {
      selectedHistoryDateKey = cell.dateKey;
      renderHistoryCalendarView(container);
    });

    gridEl.appendChild(cellDiv);
  });

  // Отрисовка выбранного дня
  const detailsEl = wrapper.querySelector("#hist-selected-details");
  const selectedEntries = historyByDate[selectedHistoryDateKey] || [];
  const selectedFormatted = selectedHistoryDateKey.split("-").reverse().join(".");

  let detailsHtml = `
    <div class="hist-day-header-box">
      <span class="hist-day-header">День: ${selectedFormatted}</span>
      <button type="button" class="btn-text-action" id="btn-add-day-workout">+ Закрыть этот день</button>
    </div>
  `;

  if (selectedEntries.length === 0) {
    detailsHtml += `
      <div class="hist-empty-day">
        <p>В этот день тренировок не было</p>
        <button type="button" class="btn-secondary-dark" id="btn-quick-close-day">+ Внести прошлую тренировку в этот день</button>
      </div>
    `;
  } else {
    selectedEntries.forEach((w) => {
      let exRows = "";
      (w.exercises || []).forEach((ex) => {
        if (ex.sets && ex.sets.length > 0) {
          const setsStr = ex.sets.map((s) => {
            if (ex.isCardio || s.distance !== undefined) {
              return `${s.distance} км (${s.time || ""})`;
            }
            return `${s.weight}×${s.reps}`;
          }).join(", ");
          exRows += `<div class="history-exercise-line"><span>${ex.name}</span><strong>${setsStr}</strong></div>`;
        }
      });

      const isRunLog = Boolean(w.isRun || w.totalDistanceKm);

      detailsHtml += `
        <div class="history-entry">
          <div class="history-head">
            <div>
              <span class="history-name">${w.title}</span>
              <span class="history-meta">${w.durationMinutes} мин • ${w.completedSetsCount} ${isRunLog ? "отрезк." : "подх."}</span>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
              ${isRunLog && w.totalDistanceKm ? `<span class="history-volume-badge run">${w.totalDistanceKm} км</span>` : (w.totalVolumeKg ? `<span class="history-volume-badge">${w.totalVolumeKg} кг</span>` : "")}
              <button type="button" class="btn-del-log-entry" data-id="${w.id || ""}" title="Удалить эту тренировку">✕</button>
            </div>
          </div>
          <div>${exRows}</div>
        </div>
      `;
    });
  }

  detailsEl.innerHTML = detailsHtml;

  // Слушатели добавления тренировки в выбранный день
  const addBtnTop = detailsEl.querySelector("#btn-add-day-workout");
  if (addBtnTop) {
    addBtnTop.addEventListener("click", () => {
      window.ExportHelper.openManualWorkoutModal(selectedHistoryDateKey, () => {
        renderHistoryCalendarView(container);
      });
    });
  }

  const addBtnEmpty = detailsEl.querySelector("#btn-quick-close-day");
  if (addBtnEmpty) {
    addBtnEmpty.addEventListener("click", () => {
      window.ExportHelper.openManualWorkoutModal(selectedHistoryDateKey, () => {
        renderHistoryCalendarView(container);
      });
    });
  }

  // Слушатели удаления логов
  detailsEl.querySelectorAll(".btn-del-log-entry").forEach((delBtn) => {
    delBtn.addEventListener("click", (e) => {
      const idToDelete = e.currentTarget.dataset.id;
      if (confirm("Удалить эту тренировку из журнала?")) {
        const allHist = window.StorageModule.getWorkoutHistory();
        const filtered = allHist.filter((item) => (idToDelete ? item.id !== idToDelete : false));
        localStorage.setItem("gym_tracker_history", JSON.stringify(filtered));
        renderHistoryCalendarView(container);
      }
    });
  });

  container.appendChild(wrapper);
}

window.HistoryView = {
  renderHistoryCalendarView
};
