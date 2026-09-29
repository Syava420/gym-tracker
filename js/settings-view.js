// Модуль настроек приложения: папки, рекорды, статистика и очистка истории

/**
 * Модальное окно управления папками программ
 */
function openFolderManagerModal(onUpdate) {
  let modal = document.getElementById("folder-manager-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "folder-manager-modal";
    modal.className = "modal-overlay";
    document.body.appendChild(modal);
  }

  const renderContent = () => {
    const rawFolders = localStorage.getItem("gym_tracker_custom_folders");
    let allFolders = [];
    try {
      allFolders = rawFolders ? JSON.parse(rawFolders) : ["Все", "Сплит Hyper-Mass", "Мои программы"];
    } catch (e) {
      allFolders = ["Все", "Сплит Hyper-Mass", "Мои программы"];
    }
    if (!allFolders.includes("Все")) allFolders.unshift("Все");

    const settings = window.StorageModule.getAppSettings();
    const showAll = settings.showAllFolder !== false;
    const editableFolders = allFolders.filter((f) => f !== "Все");

    modal.innerHTML = `
      <div class="modal-card">
        <div class="modal-header">
          <span class="modal-title">Настройка папок</span>
          <button type="button" class="modal-close" id="modal-close-btn">✕</button>
        </div>

        <div class="modal-body-scroll">
          <div class="settings-toggle-row">
            <div>
              <div class="st-label">Вкладка «Все»</div>
              <div class="st-desc">Показывать общую вкладку на главном экране</div>
            </div>
            <button type="button" class="btn-pill-toggle ${showAll ? "active" : ""}" id="toggle-show-all">
              ${showAll ? "ВКЛ" : "ВЫКЛ"}
            </button>
          </div>

          <div class="settings-sub-header">Список папок</div>
          <div class="settings-folder-list">
            ${editableFolders.map((f) => `
              <div class="settings-folder-item" data-folder="${f}">
                <span class="sf-name">${f}</span>
                <div class="sf-actions">
                  <button type="button" class="btn-sf-tool btn-sf-up" title="Сдвинуть выше">↑</button>
                  <button type="button" class="btn-sf-tool btn-sf-down" title="Сдвинуть ниже">↓</button>
                  <button type="button" class="btn-sf-tool btn-sf-rename" title="Переименовать папку" style="font-size: 10px; font-weight: 700;">Ред.</button>
                  <button type="button" class="btn-sf-tool btn-sf-delete" title="Удалить папку">✕</button>
                </div>
              </div>
            `).join("")}
          </div>

          <div class="settings-add-folder-box">
            <input type="text" class="form-input" id="new-folder-input" placeholder="Название новой папки...">
            <button type="button" class="btn-primary-dark" id="btn-save-new-folder">+ Создать</button>
          </div>
        </div>

        <div class="modal-actions" style="margin-top: 14px;">
          <button type="button" class="btn-primary-full" id="btn-done-folders">Готово</button>
        </div>
      </div>
    `;

    modal.classList.add("visible");

    // Закрытие
    const closeModal = () => {
      modal.classList.remove("visible");
      if (onUpdate) onUpdate();
    };
    modal.querySelector("#modal-close-btn").addEventListener("click", closeModal);
    modal.querySelector("#btn-done-folders").addEventListener("click", closeModal);

    // Переключение показа "Все"
    modal.querySelector("#toggle-show-all").addEventListener("click", () => {
      const nextVal = !showAll;
      window.StorageModule.saveAppSettings({ ...settings, showAllFolder: nextVal });
      renderContent();
    });

    // Добавление новой папки
    modal.querySelector("#btn-save-new-folder").addEventListener("click", () => {
      const name = modal.querySelector("#new-folder-input").value.trim();
      if (!name) return;
      if (!allFolders.includes(name)) {
        allFolders.push(name);
        window.StorageModule.saveProgramFolders(allFolders);
      }
      renderContent();
    });

    // Переименование, перемещение и удаление
    modal.querySelectorAll(".settings-folder-item").forEach((item) => {
      const folderName = item.dataset.folder;
      item.querySelector(".btn-sf-up").addEventListener("click", () => {
        window.StorageModule.moveProgramFolder(folderName, -1);
        renderContent();
      });
      item.querySelector(".btn-sf-down").addEventListener("click", () => {
        window.StorageModule.moveProgramFolder(folderName, 1);
        renderContent();
      });
      item.querySelector(".btn-sf-rename").addEventListener("click", () => {
        const next = prompt(`Переименовать папку «${folderName}» в:`, folderName);
        if (next && next.trim() && next.trim() !== folderName) {
          window.StorageModule.renameProgramFolder(folderName, next.trim());
          renderContent();
        }
      });
      item.querySelector(".btn-sf-delete").addEventListener("click", () => {
        if (confirm(`Удалить папку «${folderName}»?\nВсе программы из нее останутся во вкладке «Все».`)) {
          window.StorageModule.deleteProgramFolder(folderName);
          renderContent();
        }
      });
    });
  };

  renderContent();
}

/**
 * Рендер экрана "Настройки"
 */
function renderSettingsView(container) {
  container.innerHTML = "";

  const stats = window.StorageModule.getOverallStats();
  const prs = window.StorageModule.getAllUserPRs();
  const settings = window.StorageModule.getAppSettings();
  const showAll = settings.showAllFolder !== false;

  const wrapper = document.createElement("div");
  wrapper.className = "settings-view-wrapper";
  wrapper.innerHTML = `
    <div class="settings-view-header">
      <h2 class="view-screen-title">Настройки</h2>
    </div>

    <!-- Сводка активности -->
    <div class="settings-stats-strip">
      <div class="sss-item">
        <span class="sss-num">${stats.uniqueDays}</span>
        <span class="sss-label">Дней в зале</span>
      </div>
      <div class="sss-item">
        <span class="sss-num">${stats.timeFormatted}</span>
        <span class="sss-label">Общее время</span>
      </div>
      <div class="sss-item">
        <span class="sss-num">${stats.totalVolumeKg ? Math.round(stats.totalVolumeKg / 1000) + " т" : "0 т"}</span>
        <span class="sss-label">Тоннаж</span>
      </div>
    </div>

    <!-- Секция: Папки и интерфейс -->
    <div class="settings-card">
      <div class="settings-card-title">Папки и навигация</div>
      
      <div class="settings-row-action">
        <div>
          <div class="st-label">Вкладка «Все»</div>
          <div class="st-desc">Отображать общую вкладку на главном экране</div>
        </div>
        <button type="button" class="btn-pill-toggle ${showAll ? "active" : ""}" id="set-toggle-all">
          ${showAll ? "ВКЛ" : "ВЫКЛ"}
        </button>
      </div>

      <div class="settings-row-action">
        <div>
          <div class="st-label">Управление папками</div>
          <div class="st-desc">Переименование, удаление и добавление папок</div>
        </div>
        <button type="button" class="btn-secondary-dark" id="set-btn-manage-folders">Настроить</button>
      </div>

      <div class="settings-row-action" style="flex-direction: column; align-items: flex-start; gap: 8px;">
        <div style="display: flex; justify-content: space-between; width: 100%; align-items: center;">
          <div>
            <div class="st-label">Подъем текста меню</div>
            <div class="st-desc">Ползунок для поднятия букв над полоской жестов</div>
          </div>
          <span style="font-size: 11px; font-weight: 700; color: #ffffff;" id="bnh-val-label">${settings.bottomNavOffset !== undefined ? settings.bottomNavOffset : 8} px</span>
        </div>
        <div style="width: 100%; display: flex; align-items: center; gap: 10px; margin-top: 4px;">
          <span style="font-size: 10px; color: #666666;">Низ</span>
          <input type="range" id="slider-nav-offset" min="0" max="32" value="${settings.bottomNavOffset !== undefined ? settings.bottomNavOffset : 8}" style="flex: 1; accent-color: #ffffff; cursor: pointer;">
          <span style="font-size: 10px; color: #666666;">Верх</span>
        </div>
      </div>
    </div>

    <!-- Секция: Личные рекорды -->
    <div class="settings-card">
      <div class="settings-card-title">
        <span>Мои рекорды (PR)</span>
        <span class="sc-badge">${prs.length}</span>
      </div>
      <div class="settings-card-desc">
        Только ваши реальные рекорды. Если зафиксирован ошибочный вес — можно изменить или сбросить.
      </div>

      <div class="settings-pr-list" id="settings-pr-list">
        ${prs.length === 0 ? '<div class="settings-empty-msg">Рекордов пока нет. Они появятся после тренировок или при добавлении во вкладке «Рекорды».</div>' : ""}
        ${prs.map((pr) => {
          const valStr = pr.weight > 0 ? `${pr.weight} кг × ${pr.reps || 1}` : `${pr.distance} км (${pr.time || ""})`;
          return `
            <div class="settings-pr-item" data-key="${pr.key}">
              <div class="spr-info">
                <span class="spr-name">${pr.name}</span>
                <span class="spr-val">${valStr}</span>
              </div>
              <div class="spr-actions">
                <button type="button" class="btn-sf-tool btn-spr-edit" title="Изменить рекорд" style="font-size: 10px; font-weight: 700;">Ред.</button>
                <button type="button" class="btn-sf-tool btn-spr-del" title="Удалить / сбросить рекорд">✕</button>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    </div>

    <!-- Секция: Выгрузка в блокнот и журнал -->
    <div class="settings-card">
      <div class="settings-card-title">Выгрузка и журнал</div>
      <div class="settings-card-desc">
        Скопируйте все свои тренировки понятным текстом для блокнота (Notepad) или очистите пустые сессии.
      </div>
      <button type="button" class="btn-primary-dark full-width" id="btn-open-text-export">
        Выгрузить тренировки в блокнот (TXT)
      </button>
      <div style="margin-top: 8px;">
        <button type="button" class="btn-secondary-dark full-width" id="btn-purge-empty">
          Удалить пустые тренировки (0 подходов)
        </button>
      </div>
    </div>

    <!-- Секция: Резервная копия и сброс -->
    <div class="settings-card">
      <div class="settings-card-title">Резервная копия и сброс</div>
      <div class="settings-card-desc">
        Экспортируйте все данные в JSON для сохранения или переноса на другое устройство.
      </div>
      <div class="settings-backup-buttons">
        <button type="button" class="btn-secondary-dark" id="btn-export-json">Скачать JSON</button>
        <button type="button" class="btn-secondary-dark" id="btn-import-json">Загрузить JSON</button>
        <input type="file" id="backup-file-input" accept=".json" style="display:none;">
      </div>
      <div style="margin-top: 12px; display: flex; flex-direction: column; gap: 8px;">
        <button type="button" class="btn-secondary-dark full-width" id="btn-clear-workouts" style="color: #ffaa55; border-color: #443322;">
          Очистить тренировки (с чистого листа)
        </button>
        <button type="button" class="btn-danger-dark full-width" id="btn-reset-everything" style="color: #ff5555; border-color: #441a1a;">
          Полный сброс приложения (стереть всё)
        </button>
      </div>
    </div>
  `;

  // Переключение вкладки "Все"
  wrapper.querySelector("#set-toggle-all").addEventListener("click", () => {
    const nextVal = !showAll;
    window.StorageModule.saveAppSettings({ ...settings, showAllFolder: nextVal });
    renderSettingsView(container);
  });

  // Модалка папок
  wrapper.querySelector("#set-btn-manage-folders").addEventListener("click", () => {
    openFolderManagerModal(() => {
      renderSettingsView(container);
    });
  });

  // Ползунок подъема текста меню
  const navSlider = wrapper.querySelector("#slider-nav-offset");
  if (navSlider) {
    navSlider.addEventListener("input", (e) => {
      const val = parseInt(e.target.value, 10);
      document.documentElement.style.setProperty("--bottom-nav-offset", val + "px");
      const label = wrapper.querySelector("#bnh-val-label");
      if (label) label.textContent = val + " px";
    });
    navSlider.addEventListener("change", (e) => {
      const val = parseInt(e.target.value, 10);
      const currentSettings = window.StorageModule.getAppSettings();
      window.StorageModule.saveAppSettings({ ...currentSettings, bottomNavOffset: val });
    });
  }

  // Выгрузка в блокнот
  wrapper.querySelector("#btn-open-text-export").addEventListener("click", () => {
    window.ExportHelper.openTextExportModal();
  });

  // Редактирование / удаление PR
  wrapper.querySelectorAll(".settings-pr-item").forEach((row) => {
    const key = row.dataset.key;
    const pr = prs.find((p) => p.key === key);
    if (!pr) return;

    row.querySelector(".btn-spr-edit").addEventListener("click", () => {
      if (pr.distance > 0) {
        const nextDist = prompt(`Рекордная дистанция (км) для «${pr.name}»:`, pr.distance);
        if (nextDist !== null) {
          const parsed = parseFloat(nextDist);
          if (!isNaN(parsed) && parsed > 0) {
            window.StorageModule.saveCustomPR(key, { ...pr, distance: parsed, updatedAt: new Date().toISOString() });
            renderSettingsView(container);
          }
        }
      } else {
        const nextWeight = prompt(`Рекордный вес (кг) для «${pr.name}»:`, pr.weight);
        if (nextWeight !== null) {
          const parsed = parseFloat(nextWeight);
          if (!isNaN(parsed) && parsed >= 0) {
            const nextReps = prompt("Количество повторений:", pr.reps || 1);
            window.StorageModule.saveCustomPR(key, {
              ...pr,
              weight: parsed,
              reps: parseInt(nextReps) || 1,
              updatedAt: new Date().toISOString()
            });
            renderSettingsView(container);
          }
        }
      }
    });

    row.querySelector(".btn-spr-del").addEventListener("click", () => {
      if (confirm(`Сбросить рекорд для «${pr.name}»?`)) {
        window.StorageModule.deleteCustomPR(key);
        renderSettingsView(container);
      }
    });
  });

  // Очистка пустых тренировок
  wrapper.querySelector("#btn-purge-empty").addEventListener("click", () => {
    const removedCount = window.StorageModule.purgeEmptyWorkouts();
    alert(`Очистка завершена! Удалено пустых записей: ${removedCount}`);
    renderSettingsView(container);
  });

  // Экспорт JSON
  wrapper.querySelector("#btn-export-json").addEventListener("click", () => {
    const dataStr = window.StorageModule.exportAllData();
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gym_tracker_backup_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // Импорт JSON
  const fileInput = wrapper.querySelector("#backup-file-input");
  wrapper.querySelector("#btn-import-json").addEventListener("click", () => {
    fileInput.click();
  });
  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const ok = window.StorageModule.importAllData(evt.target.result);
      if (ok) {
        alert("Данные успешно восстановлены!");
        renderSettingsView(container);
      } else {
        alert("Ошибка при чтении файла резервной копии.");
      }
    };
    reader.readAsText(file);
  });

  // Очистить тренировки (с чистого листа)
  wrapper.querySelector("#btn-clear-workouts").addEventListener("click", () => {
    if (confirm("Удалить все созданные тренировки и папки?\nПриложение станет полностью пустым (история выполненных тренировок сохранится).")) {
      window.StorageModule.clearAllWorkouts();
      alert("Тренировки удалены! Список теперь пуст.");
      renderSettingsView(container);
    }
  });

  // Полный сброс приложения
  wrapper.querySelector("#btn-reset-everything").addEventListener("click", () => {
    if (confirm("ВНИМАНИЕ: Стереть ВСЕ данные (тренировки, историю и рекорды)?\nПриложение будет сброшено до нуля.")) {
      window.StorageModule.clearEverything();
      alert("Приложение полностью очищено!");
      window.location.reload();
    }
  });

  container.appendChild(wrapper);
}

window.SettingsView = {
  openFolderManagerModal,
  renderSettingsView
};
