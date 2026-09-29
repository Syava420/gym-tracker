// Модуль экрана "Главная": чистый компактный вид без лишних блоков, папки с долгим нажатием и карточки программ

let selectedProgramFolder = "Все";

/**
 * Модальное окно действий с папкой (переименовать, поменять местами, удалить)
 */
function openFolderActionSheet(folderName, onDone) {
  if (!folderName || folderName === "Все") return;

  const rawFolders = window.StorageModule.getProgramFolders();
  const idx = rawFolders.indexOf(folderName);
  const minIdx = rawFolders.includes("Все") ? 1 : 0;
  const canMoveLeft = idx > minIdx;
  const canMoveRight = idx !== -1 && idx < rawFolders.length - 1;

  let sheet = document.getElementById("folder-action-sheet");
  if (!sheet) {
    sheet = document.createElement("div");
    sheet.id = "folder-action-sheet";
    sheet.className = "modal-overlay";
    document.body.appendChild(sheet);
  }

  sheet.innerHTML = `
    <div class="modal-card" style="max-width: 360px;">
      <div class="modal-header">
        <span class="modal-title">Папка «${folderName}»</span>
        <button type="button" class="modal-close" id="fas-close">✕</button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 12px;">
        <button type="button" class="btn-secondary-dark full-width" id="fas-rename" style="text-align: left; padding: 12px 14px; font-size: 13px;">
          ✏️ Переименовать
        </button>

        <div style="display: flex; gap: 8px;">
          <button type="button" class="btn-secondary-dark" id="fas-move-left" ${canMoveLeft ? "" : "disabled style='opacity:0.3;'"} style="flex: 1; padding: 10px 4px; font-size: 11px;">
            ⬅️ Сдвинуть влево
          </button>
          <button type="button" class="btn-secondary-dark" id="fas-move-right" ${canMoveRight ? "" : "disabled style='opacity:0.3;'"} style="flex: 1; padding: 10px 4px; font-size: 11px;">
            ➡️ Сдвинуть вправо
          </button>
        </div>

        <button type="button" class="btn-secondary-dark full-width" id="fas-delete" style="text-align: left; padding: 12px 14px; font-size: 13px; color: #f87171; border-color: #3d1c1c;">
          🗑️ Удалить папку
        </button>
      </div>
    </div>
  `;

  sheet.classList.add("visible");
  const close = () => {
    sheet.classList.remove("visible");
  };

  sheet.querySelector("#fas-close").addEventListener("click", close);

  sheet.querySelector("#fas-rename").addEventListener("click", () => {
    close();
    const next = prompt(`Переименовать папку «${folderName}» в:`, folderName);
    if (next && next.trim() && next.trim() !== folderName) {
      window.StorageModule.renameProgramFolder(folderName, next.trim());
      if (onDone) onDone(next.trim());
    }
  });

  const btnLeft = sheet.querySelector("#fas-move-left");
  if (btnLeft && canMoveLeft) {
    btnLeft.addEventListener("click", () => {
      close();
      window.StorageModule.moveProgramFolder(folderName, -1);
      if (onDone) onDone(folderName);
    });
  }

  const btnRight = sheet.querySelector("#fas-move-right");
  if (btnRight && canMoveRight) {
    btnRight.addEventListener("click", () => {
      close();
      window.StorageModule.moveProgramFolder(folderName, 1);
      if (onDone) onDone(folderName);
    });
  }

  sheet.querySelector("#fas-delete").addEventListener("click", () => {
    close();
    if (confirm(`Удалить папку «${folderName}»?\nВсе программы из нее сохранятся во вкладке «Все».`)) {
      window.StorageModule.deleteProgramFolder(folderName);
      if (onDone) onDone("Все");
    }
  });
}

function renderHomeView(container, onStartWorkout, onResumeWorkout, onCancelWorkout) {
  container.innerHTML = "";

  // 1. Плашка активной тренировки (только если идет тренировка)
  const activeSession = window.StorageModule.getActiveSession();
  if (activeSession && activeSession.workout && activeSession.startTime) {
    const banner = document.createElement("div");
    banner.className = "active-workout-banner";
    const elapsedSec = Math.floor((Date.now() - activeSession.startTime) / 1000);
    const m = Math.floor(elapsedSec / 60);
    const s = elapsedSec % 60;
    const timeFormatted = `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
    banner.innerHTML = `
      <div class="awb-left">
        <span class="awb-pulse"></span>
        <div class="awb-info">
          <span class="awb-label">Идёт тренировка</span>
          <span class="awb-title">${activeSession.workout.title} • <span class="awb-timer">${timeFormatted}</span></span>
        </div>
      </div>
      <div class="awb-actions">
        <button type="button" class="btn-awb-resume" id="awb-resume-btn">Продолжить</button>
        <button type="button" class="btn-awb-cancel" id="awb-cancel-btn" title="Сбросить тренировку">✕</button>
      </div>
    `;
    banner.querySelector("#awb-resume-btn").addEventListener("click", () => {
      if (onResumeWorkout) onResumeWorkout();
    });
    banner.querySelector("#awb-cancel-btn").addEventListener("click", () => {
      if (confirm(`Отменить и сбросить тренировку «${activeSession.workout.title}»?`)) {
        if (onCancelWorkout) onCancelWorkout();
      }
    });
    container.appendChild(banner);
  }

  // 2. Папки программ (компактная шапка, долгое нажатие для управления)
  const folders = window.StorageModule.getProgramFolders();
  if (!folders.includes(selectedProgramFolder)) {
    selectedProgramFolder = folders[0] || "Все";
  }

  const folderBox = document.createElement("div");
  folderBox.className = "program-folders-section";
  folderBox.innerHTML = `
    <div class="folders-header">
      <span class="section-label">Папки</span>
      <div class="folders-header-actions">
        <button type="button" class="btn-text-action" id="btn-add-folder">+ Папка</button>
        <button type="button" class="btn-text-action" id="btn-manage-folders" title="Настройка папок">⚙</button>
      </div>
    </div>
    <div class="program-folder-tabs" id="prog-folder-tabs">
      ${folders.map((f) => `
        <button type="button" class="folder-tab-pill ${f === selectedProgramFolder ? "active" : ""}" data-folder="${f}">
          ${f}
        </button>
      `).join("")}
    </div>
  `;

  // Добавление новой папки
  folderBox.querySelector("#btn-add-folder").addEventListener("click", () => {
    window.ModalsModule.openAddFolderModal((newFolder) => {
      if (!folders.includes(newFolder)) {
        folders.push(newFolder);
        window.StorageModule.saveProgramFolders(folders);
      }
      selectedProgramFolder = newFolder;
      renderHomeView(container, onStartWorkout, onResumeWorkout, onCancelWorkout);
    });
  });

  // Управление папками через настройки
  folderBox.querySelector("#btn-manage-folders").addEventListener("click", () => {
    window.SettingsView.openFolderManagerModal(() => {
      renderHomeView(container, onStartWorkout, onResumeWorkout, onCancelWorkout);
    });
  });

  // Переключение в 1 клик + долгое нажатие (400мс) для действий с папкой
  folderBox.querySelectorAll(".folder-tab-pill").forEach((btn) => {
    const f = btn.dataset.folder;
    let pressTimer = null;
    let didLongPress = false;

    const startPress = () => {
      didLongPress = false;
      if (f === "Все") return;
      pressTimer = setTimeout(() => {
        didLongPress = true;
        if (navigator.vibrate) try { navigator.vibrate(40); } catch(e) {}
        openFolderActionSheet(f, (nextFolder) => {
          selectedProgramFolder = nextFolder || selectedProgramFolder;
          renderHomeView(container, onStartWorkout, onResumeWorkout, onCancelWorkout);
        });
      }, 450);
    };

    const cancelPress = () => {
      clearTimeout(pressTimer);
    };

    btn.addEventListener("touchstart", startPress, { passive: true });
    btn.addEventListener("touchmove", cancelPress, { passive: true });
    btn.addEventListener("touchend", cancelPress);
    btn.addEventListener("mousedown", startPress);
    btn.addEventListener("mouseup", cancelPress);
    btn.addEventListener("mouseleave", cancelPress);

    btn.addEventListener("click", () => {
      if (didLongPress) return;
      selectedProgramFolder = f;
      renderHomeView(container, onStartWorkout, onResumeWorkout, onCancelWorkout);
    });
  });

  container.appendChild(folderBox);

  // 3. Список тренировок
  const routines = window.StorageModule.getWorkoutRoutines();
  let routinesModified = false;
  routines.forEach((r) => {
    if (!r.folder || (!folders.includes(r.folder) && r.folder !== "Все")) {
      r.folder = "Все";
      routinesModified = true;
    }
  });
  if (routinesModified) {
    window.StorageModule.saveWorkoutRoutines(routines);
  }

  const filteredRoutines = selectedProgramFolder === "Все"
    ? routines
    : routines.filter((r) => r.folder === selectedProgramFolder);

  const listSection = document.createElement("div");
  listSection.innerHTML = `
    <div class="routines-list-header">
      <span class="section-label">Тренировки (${filteredRoutines.length})</span>
      <button type="button" class="btn-text-action" id="btn-add-routine">+ Новая тренировка</button>
    </div>
    <div class="workout-cards-list" id="workout-cards-list"></div>
  `;

  listSection.querySelector("#btn-add-routine").addEventListener("click", () => {
    const openBuilder = (window.ProgramBuilderModal && window.ProgramBuilderModal.openProgramBuilderModal) || window.ModalsModule.openProgramModal;
    openBuilder(null, (newRoutine) => {
      routines.push(newRoutine);
      window.StorageModule.saveWorkoutRoutines(routines);
      renderHomeView(container, onStartWorkout);
    }, selectedProgramFolder);
  });

  const cardsContainer = listSection.querySelector("#workout-cards-list");

  if (filteredRoutines.length === 0) {
    cardsContainer.innerHTML = `
      <div class="empty-state-box">
        <div class="empty-state-title">Тренировок пока нет</div>
        <div class="empty-state-desc">Создай свою первую тренировку с упражнениями</div>
        <button type="button" class="btn-empty-add" id="btn-empty-create">+ Создать тренировку</button>
      </div>
    `;
    const emptyBtn = cardsContainer.querySelector("#btn-empty-create");
    if (emptyBtn) {
      emptyBtn.addEventListener("click", () => {
        const openBuilder = (window.ProgramBuilderModal && window.ProgramBuilderModal.openProgramBuilderModal) || window.ModalsModule.openProgramModal;
        openBuilder(null, (newRoutine) => {
          routines.push(newRoutine);
          window.StorageModule.saveWorkoutRoutines(routines);
          renderHomeView(container, onStartWorkout);
        }, selectedProgramFolder);
      });
    }
  } else {
    filteredRoutines.forEach((item) => {
      const isRunWorkout = Boolean(item.isRun || item.folder === "Бег 3 км");
      const card = document.createElement("div");
      card.className = "workout-card";

      card.innerHTML = `
        <div class="card-header-line">
          <div class="card-badges-left">
            <span class="workout-tag ${isRunWorkout ? "run" : ""}">${item.tag || "ТР"}</span>
            <span class="workout-count">${item.exercises ? item.exercises.length : 0} ${isRunWorkout ? "этапа" : "упр."}</span>
          </div>
          <div class="card-tools-right">
            <button type="button" class="btn-card-action btn-edit-prog" title="Редактировать">Ред.</button>
            <button type="button" class="btn-card-action btn-del-prog" title="Удалить">✕</button>
          </div>
        </div>

        <div class="card-body-content">
          <div class="workout-name">${item.title}</div>
          ${item.subtitle ? `<div class="workout-sub">${item.subtitle}</div>` : ""}
        </div>
      `;

      card.addEventListener("click", () => {
        onStartWorkout(item);
      });

      card.querySelector(".btn-edit-prog").addEventListener("click", (e) => {
        e.stopPropagation();
        const openBuilder = (window.ProgramBuilderModal && window.ProgramBuilderModal.openProgramBuilderModal) || window.ModalsModule.openProgramModal;
        openBuilder(item, (updated) => {
          const idx = routines.findIndex((r) => r.id === item.id);
          if (idx !== -1) routines[idx] = updated;
          window.StorageModule.saveWorkoutRoutines(routines);
          renderHomeView(container, onStartWorkout);
        });
      });

      card.querySelector(".btn-del-prog").addEventListener("click", (e) => {
        e.stopPropagation();
        if (confirm(`Удалить тренировку «${item.title}»?`)) {
          const idx = routines.findIndex((r) => r.id === item.id);
          if (idx !== -1) routines.splice(idx, 1);
          window.StorageModule.saveWorkoutRoutines(routines);
          renderHomeView(container, onStartWorkout);
        }
      });

      cardsContainer.appendChild(card);
    });
  }

  container.appendChild(listSection);
}

window.HomeView = {
  renderHomeView
};
