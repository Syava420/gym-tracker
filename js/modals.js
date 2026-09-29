// Модуль модальных окон: 100+ упражнений с автопоиском, управление папками и программами

function openAddExerciseModal(onSelect) {
  let modal = document.getElementById("add-exercise-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "add-exercise-modal";
    modal.className = "modal-overlay";
    document.body.appendChild(modal);
  }

  let selectedCategory = "Все";
  let searchQuery = "";

  function renderModalContent() {
    const catalog = window.EXERCISE_CATALOG || [];
    const categories = window.EXERCISE_CATEGORIES || ["Все"];

    const filtered = catalog.filter((ex) => {
      const matchCat = selectedCategory === "Все" || ex.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || ex.name.toLowerCase().includes(q) || (ex.equip && ex.equip.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });

    modal.innerHTML = `
      <div class="modal-card">
        <div class="modal-header">
          <span class="modal-title">Добавить упражнение (${catalog.length})</span>
          <button type="button" class="modal-close" id="modal-close-btn">✕</button>
        </div>

        <div class="search-box">
          <input type="text" id="catalog-search" class="search-input" placeholder="Быстрый поиск: жим, присед, гантели..." value="${searchQuery}">
        </div>

        <div class="category-tabs" id="category-tabs">
          ${categories.map((cat) => `
            <button type="button" class="cat-pill ${cat === selectedCategory ? "active" : ""}" data-cat="${cat}">${cat}</button>
          `).join("")}
        </div>

        <div class="catalog-list">
          ${filtered.length > 0 ? filtered.map((item) => `
            <div class="catalog-item" data-id="${item.id}">
              <div style="flex:1;">
                <div class="catalog-name">${item.name}</div>
                <div class="catalog-badges">
                  <span class="badge-cat">${item.category}</span>
                  <span class="badge-equip">${item.equip || "Снаряд"}</span>
                  <span class="badge-reps">${item.isCardio || item.category === "Бег" || item.category === "Эллипс" ? item.targetReps : item.targetReps + " повт"}</span>
                </div>
              </div>
              <button type="button" class="btn-select-ex">+</button>
            </div>
          `).join("") : `
            <div class="empty-search-box">
              <p>Упражнение не найдено в базе.</p>
              ${searchQuery ? `<button type="button" id="btn-create-typed" class="btn-primary-sm" style="margin-top:10px;">Создать «${searchQuery}»</button>` : ""}
            </div>
          `}
        </div>
      </div>
    `;

    modal.classList.add("visible");

    const searchInput = modal.querySelector("#catalog-search");
    if (searchQuery) {
      searchInput.focus();
      searchInput.setSelectionRange(searchQuery.length, searchQuery.length);
    }

    searchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value;
      renderModalContent();
    });

    modal.querySelector("#modal-close-btn").addEventListener("click", () => {
      modal.classList.remove("visible");
    });

    modal.querySelectorAll(".cat-pill").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        selectedCategory = e.target.dataset.cat;
        renderModalContent();
      });
    });

    modal.querySelectorAll(".catalog-item").forEach((card) => {
      card.addEventListener("click", () => {
        const id = card.dataset.id;
        const exData = catalog.find((x) => x.id === id);
        if (exData) {
          modal.classList.remove("visible");
          onSelect(JSON.parse(JSON.stringify(exData)));
        }
      });
    });

    const createTypedBtn = modal.querySelector("#btn-create-typed");
    if (createTypedBtn) {
      createTypedBtn.addEventListener("click", () => {
        modal.classList.remove("visible");
        const isAutoCardio = selectedCategory === "Бег" || selectedCategory === "Эллипс" || /(бег|эллипс|run|кардио|дорожк|ходьб|вело|шаг|лыж)/i.test(searchQuery);
        onSelect({
          id: "custom_" + Date.now(),
          name: searchQuery.trim(),
          category: selectedCategory === "Все" ? (isAutoCardio ? "Бег" : "Свое") : selectedCategory,
          equip: isAutoCardio ? "Дорожка" : "Свое",
          setsCount: 3,
          isCardio: isAutoCardio,
          defaultDistance: isAutoCardio ? 0.4 : undefined,
          defaultPace: isAutoCardio ? "04:20" : undefined,
          defaultWeight: isAutoCardio ? 0 : 20,
          targetReps: isAutoCardio ? "400 м" : "8-10",
          restSeconds: 120,
          tip: "Твоя заметка к упражнению"
        });
      });
    }
  }

  renderModalContent();
}

function openEditExerciseModal(exercise, onSave) {
  let modal = document.getElementById("edit-exercise-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "edit-exercise-modal";
    modal.className = "modal-overlay";
    document.body.appendChild(modal);
  }

  let isCardio = Boolean(
    exercise.isCardio || 
    exercise.category === "Бег" || 
    exercise.category === "Эллипс" ||
    (window.CardioHelper && window.CardioHelper.isCardioExercise(exercise))
  );
  let cardioType = window.CardioHelper ? window.CardioHelper.getCardioType(exercise) : (exercise.category === "Эллипс" ? "ellipse" : "treadmill");
  let cardioMode = exercise.cardioMode || "distance";

  function renderEditForm() {
    modal.innerHTML = `
      <div class="modal-card">
        <div class="modal-header">
          <span class="modal-title">Настройка упражнения</span>
          <button type="button" class="modal-close" id="edit-close-btn">✕</button>
        </div>

        <div class="form-group">
          <label class="form-label">Тип упражнения (колонки в карточке)</label>
          <div class="type-switch-box">
            <button type="button" class="type-pill ${!isCardio ? "active" : ""}" id="type-strength-btn">Силовое (Кг × Повт)</button>
            <button type="button" class="type-pill ${isCardio ? "active" : ""}" id="type-cardio-btn">Бег / Кардио (Таймер / Км)</button>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Название упражнения</label>
          <input type="text" id="edit-ex-name" class="form-input" value="${exercise.name}">
        </div>

        <div class="form-group">
          <label class="form-label">Ссылка на видео / YouTube (необязательно)</label>
          <input type="url" id="edit-ex-youtube" class="form-input" placeholder="https://youtube.com/..." value="${exercise.youtubeUrl || ""}">
        </div>

        <div class="form-group">
          <label class="form-label">Заметка / Техника / Подсказка</label>
          <textarea id="edit-ex-tip" class="form-textarea" rows="2">${exercise.tip || ""}</textarea>
        </div>

        ${isCardio ? `
          <div class="form-row">
            <div class="form-group" style="flex:1;">
              <label class="form-label">Тренажер</label>
              <select id="edit-cardio-type" class="form-select">
                <option value="treadmill" ${cardioType === "treadmill" ? "selected" : ""}>Дорожка (Уклон %)</option>
                <option value="ellipse" ${cardioType === "ellipse" ? "selected" : ""}>Эллипс / Вело (Тяжесть Lvl)</option>
              </select>
            </div>
            <div class="form-group" style="flex:1;">
              <label class="form-label">Режим</label>
              <select id="edit-cardio-mode" class="form-select">
                <option value="distance" ${cardioMode === "distance" ? "selected" : ""}>По дистанции (км)</option>
                <option value="time" ${cardioMode === "time" ? "selected" : ""}>По времени (мин)</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group" style="flex:1;">
              <label class="form-label">${cardioType === "ellipse" ? "Тяжесть (Lvl)" : "Уклон дорожки (%)"}</label>
              <input type="number" id="edit-cardio-param" class="form-input" value="${cardioType === "ellipse" ? (exercise.resistanceLevel !== undefined ? exercise.resistanceLevel : 5) : (exercise.incline !== undefined ? exercise.incline : 1)}" step="${cardioType === "ellipse" ? 1 : 0.5}">
            </div>
            <div class="form-group" style="flex:1;">
              <label class="form-label">${cardioMode === "time" ? "Время (мин)" : "Дистанция (км)"}</label>
              <input type="number" step="${cardioMode === "time" ? 1 : 0.1}" id="edit-cardio-target-val" class="form-input" value="${cardioMode === "time" ? (exercise.targetMinutes || 20) : (exercise.defaultDistance || 0.4)}">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Отдых между отрезками (сек)</label>
            <input type="number" id="edit-ex-rest" class="form-input" value="${exercise.restSeconds !== undefined ? exercise.restSeconds : 120}" step="15">
          </div>
        ` : `
          <div class="form-row">
            <div class="form-group" style="flex:1;">
              <label class="form-label">Целевые повторения</label>
              <input type="text" id="edit-ex-reps" class="form-input" value="${exercise.targetReps || "8-10"}">
            </div>
            <div class="form-group" style="flex:1;">
              <label class="form-label">Отдых (сек)</label>
              <input type="number" id="edit-ex-rest" class="form-input" value="${exercise.restSeconds !== undefined ? exercise.restSeconds : 120}" step="15">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Рабочий вес по умолчанию (кг)</label>
            <input type="number" id="edit-ex-weight" class="form-input" value="${exercise.defaultWeight || 20}">
          </div>
        `}

        <div class="modal-actions">
          <button type="button" id="edit-save-btn" class="btn-primary-full">Сохранить</button>
        </div>
      </div>
    `;

    modal.classList.add("visible");
    modal.querySelector("#edit-close-btn").addEventListener("click", () => modal.classList.remove("visible"));

    modal.querySelector("#type-strength-btn").addEventListener("click", () => {
      isCardio = false;
      renderEditForm();
    });

    modal.querySelector("#type-cardio-btn").addEventListener("click", () => {
      isCardio = true;
      renderEditForm();
    });

    const cTypeSelect = modal.querySelector("#edit-cardio-type");
    if (cTypeSelect) {
      cTypeSelect.addEventListener("change", (e) => {
        cardioType = e.target.value;
        renderEditForm();
      });
    }

    const cModeSelect = modal.querySelector("#edit-cardio-mode");
    if (cModeSelect) {
      cModeSelect.addEventListener("change", (e) => {
        cardioMode = e.target.value;
        renderEditForm();
      });
    }

    modal.querySelector("#edit-save-btn").addEventListener("click", () => {
      const prevWasCardio = Boolean(exercise.isCardio || exercise.category === "Бег" || exercise.category === "Эллипс");
      exercise.name = modal.querySelector("#edit-ex-name").value.trim() || exercise.name;
      exercise.youtubeUrl = modal.querySelector("#edit-ex-youtube").value.trim();
      exercise.tip = modal.querySelector("#edit-ex-tip").value.trim();
      exercise.restSeconds = parseInt(modal.querySelector("#edit-ex-rest").value) || 0;
      exercise.isCardio = isCardio;

      if (isCardio) {
        exercise.cardioType = cardioType;
        exercise.cardioMode = cardioMode;
        if (cardioType === "ellipse") {
          const paramEl = modal.querySelector("#edit-cardio-param");
          exercise.resistanceLevel = paramEl ? (parseInt(paramEl.value, 10) || 5) : 5;
          exercise.category = "Эллипс";
        } else {
          const paramEl = modal.querySelector("#edit-cardio-param");
          exercise.incline = paramEl ? (parseFloat(paramEl.value) || 0) : 1;
          exercise.category = "Бег";
        }

        if (cardioMode === "time") {
          const targetValEl = modal.querySelector("#edit-cardio-target-val");
          exercise.targetMinutes = targetValEl ? (parseInt(targetValEl.value, 10) || 20) : 20;
          exercise.targetReps = `${exercise.targetMinutes} мин`;
        } else {
          const targetValEl = modal.querySelector("#edit-cardio-target-val");
          exercise.defaultDistance = targetValEl ? (parseFloat(targetValEl.value) || 0.4) : 0.4;
          exercise.defaultPace = exercise.targetReps || "04:20";
        }

        if (!prevWasCardio && exercise.sets) {
          exercise.sets.forEach((s) => {
            s.distance = s.distance || exercise.defaultDistance || 0.4;
            s.time = s.time || (cardioMode === "time" ? `${exercise.targetMinutes || 20} мин` : "04:20");
            s.minutes = exercise.targetMinutes || 20;
            s.incline = exercise.incline != null ? exercise.incline : 1;
            s.level = exercise.resistanceLevel != null ? exercise.resistanceLevel : 5;
          });
        }
      } else {
        const repsEl = modal.querySelector("#edit-ex-reps");
        exercise.targetReps = repsEl ? repsEl.value.trim() : (exercise.targetReps || "8-10");
        const weightEl = modal.querySelector("#edit-ex-weight");
        exercise.defaultWeight = weightEl ? (parseFloat(weightEl.value) || 20) : 20;
        if (exercise.category === "Бег" || exercise.category === "Эллипс") exercise.category = "Свое";

        if (prevWasCardio && exercise.sets) {
          exercise.sets.forEach((s) => {
            s.weight = s.weight || exercise.defaultWeight;
            s.reps = s.reps || parseInt(exercise.targetReps) || 8;
          });
        }
      }

      modal.classList.remove("visible");
      onSave(exercise);
    });
  }

  renderEditForm();
}

function openProgramModal(existingRoutine, onSave, defaultFolder) {
  let modal = document.getElementById("program-edit-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "program-edit-modal";
    modal.className = "modal-overlay";
    document.body.appendChild(modal);
  }

  const isEdit = Boolean(existingRoutine);
  const folders = window.StorageModule.getProgramFolders() || [];
  const targetFolder = isEdit
    ? existingRoutine.folder
    : (defaultFolder || (folders[0] || "Все"));

  modal.innerHTML = `
    <div class="modal-card">
      <div class="modal-header">
        <span class="modal-title">${isEdit ? "Изменить программу" : "Новая тренировка"}</span>
        <button type="button" class="modal-close" id="prog-close-btn">✕</button>
      </div>

      <div class="form-group">
        <label class="form-label">Название программы (например, «Верх А» или «Спина + Бицепс»)</label>
        <input type="text" id="prog-name" class="form-input" value="${isEdit ? existingRoutine.title : ""}" placeholder="Название...">
      </div>

      <div class="form-group">
        <label class="form-label">Описание / Мышечные группы</label>
        <input type="text" id="prog-sub" class="form-input" value="${isEdit ? existingRoutine.subtitle : ""}" placeholder="Например: Грудь, трицепс">
      </div>

      <div class="form-row">
        <div class="form-group" style="flex:1;">
          <label class="form-label">Тег дня (ПН, ВТ...)</label>
          <input type="text" id="prog-tag" class="form-input" value="${isEdit ? existingRoutine.tag : "ПН"}" maxlength="4">
        </div>
        <div class="form-group" style="flex:2;">
          <label class="form-label">Папка программы</label>
          <select id="prog-folder" class="form-select">
            ${folders.map((f) => `
              <option value="${f}" ${targetFolder === f ? "selected" : ""}>${f}</option>
            `).join("")}
          </select>
        </div>
      </div>

      <div class="modal-actions">
        <button type="button" id="prog-save-btn" class="btn-primary-full">
          ${isEdit ? "Сохранить изменения" : "Создать тренировку"}
        </button>
      </div>
    </div>
  `;

  modal.classList.add("visible");
  modal.querySelector("#prog-close-btn").addEventListener("click", () => modal.classList.remove("visible"));
  modal.querySelector("#prog-save-btn").addEventListener("click", () => {
    const title = modal.querySelector("#prog-name").value.trim();
    if (!title) {
      alert("Укажите название программы!");
      return;
    }
    const subtitle = modal.querySelector("#prog-sub").value.trim() || "Тренировка";
    const tag = modal.querySelector("#prog-tag").value.trim() || "ТР";
    const folder = modal.querySelector("#prog-folder").value;

    const result = {
      id: isEdit ? existingRoutine.id : "routine_" + Date.now(),
      title,
      subtitle,
      tag: tag.toUpperCase(),
      folder,
      exercises: isEdit ? existingRoutine.exercises : []
    };

    modal.classList.remove("visible");
    onSave(result, isEdit);
  });
}

function openAddFolderModal(onSave) {
  let modal = document.getElementById("folder-add-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "folder-add-modal";
    modal.className = "modal-overlay";
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal-card">
      <div class="modal-header">
        <span class="modal-title">Создать папку</span>
        <button type="button" class="modal-close" id="folder-close-btn">✕</button>
      </div>

      <div class="form-group">
        <label class="form-label">Название папки (например: «Фулбоди» или «Для дома»)</label>
        <input type="text" id="new-folder-name" class="form-input" placeholder="Название папки...">
      </div>

      <div class="modal-actions">
        <button type="button" id="folder-save-btn" class="btn-primary-full">Создать папку</button>
      </div>
    </div>
  `;

  modal.classList.add("visible");
  modal.querySelector("#folder-close-btn").addEventListener("click", () => modal.classList.remove("visible"));
  modal.querySelector("#folder-save-btn").addEventListener("click", () => {
    const name = modal.querySelector("#new-folder-name").value.trim();
    if (!name) return;
    modal.classList.remove("visible");
    onSave(name);
  });
}

function openEditFolderModal(currentName, onSave) {
  let modal = document.getElementById("folder-edit-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "folder-edit-modal";
    modal.className = "modal-overlay";
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal-card">
      <div class="modal-header">
        <span class="modal-title">Переименовать папку</span>
        <button type="button" class="modal-close" id="folder-edit-close-btn">✕</button>
      </div>

      <div class="form-group">
        <label class="form-label">Название папки</label>
        <input type="text" id="rename-folder-input" class="form-input" value="${currentName}">
      </div>

      <div class="modal-actions">
        <button type="button" id="folder-rename-btn" class="btn-primary-full">Сохранить</button>
      </div>
    </div>
  `;

  modal.classList.add("visible");
  const inputEl = modal.querySelector("#rename-folder-input");
  inputEl.focus();
  inputEl.select();

  modal.querySelector("#folder-edit-close-btn").addEventListener("click", () => modal.classList.remove("visible"));
  modal.querySelector("#folder-rename-btn").addEventListener("click", () => {
    const newName = inputEl.value.trim();
    if (!newName) return;
    modal.classList.remove("visible");
    onSave(newName);
  });
}

window.ModalsModule = {
  openAddExerciseModal,
  openEditExerciseModal,
  openProgramModal,
  openAddFolderModal,
  openEditFolderModal
};
