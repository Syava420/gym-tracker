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
                  <span class="badge-reps">${item.isCardio || item.category === "Бег" || item.category === "Эллипс" || item.category === "Вело" ? item.targetReps : item.targetReps + " повт"}</span>
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
    exercise.category === "Вело" ||
    exercise.category === "Кардио" ||
    (window.CardioHelper && window.CardioHelper.isCardioExercise(exercise))
  );
  let cardioType = window.CardioHelper ? window.CardioHelper.getCardioType(exercise) : "treadmill";
  let cardioMode = exercise.cardioMode || "distance";
  let distUnit = window.CardioHelper ? window.CardioHelper.getDistUnit(exercise) : (exercise.distUnit || "km");
  let timeUnit = window.CardioHelper ? window.CardioHelper.getTimeUnit(exercise) : (exercise.timeUnit || "min");

  function renderEditForm() {
    const paramMeta = window.CardioHelper ? window.CardioHelper.getCardioParamMeta({ cardioType }) : { name: "Уклон", unit: "%", step: 0.5, defaultVal: 1, prop: "incline", min: 0, max: 20 };

    let totalRestSec = exercise.restSeconds != null ? exercise.restSeconds : 120;
    let restUnit = "sec";
    let restDisplayVal = totalRestSec;
    let restDisplayStep = 15;
    if (totalRestSec >= 3600 && totalRestSec % 3600 === 0) {
      restUnit = "hour";
      restDisplayVal = totalRestSec / 3600;
      restDisplayStep = 0.5;
    } else if (totalRestSec >= 60 && totalRestSec % 60 === 0) {
      restUnit = "min";
      restDisplayVal = totalRestSec / 60;
      restDisplayStep = 0.5;
    } else if (totalRestSec >= 60) {
      restUnit = "min";
      restDisplayVal = Math.round((totalRestSec / 60) * 10) / 10;
      restDisplayStep = 0.5;
    }

    modal.innerHTML = `
      <div class="modal-card">
        <div class="modal-header">
          <span class="modal-title">Настройка упражнения</span>
          <button type="button" class="modal-close" id="edit-close-btn">✕</button>
        </div>

        <div class="form-group">
          <label class="form-label">Тип упражнения (колонки в карточке)</label>
          <div class="type-switch-box">
            <button type="button" class="type-pill ${!isCardio ? "active" : ""}" id="type-strength-btn">Силовые</button>
            <button type="button" class="type-pill ${isCardio ? "active" : ""}" id="type-cardio-btn">Кардио</button>
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
              <label class="form-label">Тренажер / Оборудование</label>
              <select id="edit-cardio-type" class="form-select">
                <option value="treadmill" ${cardioType === "treadmill" ? "selected" : ""}>Беговая дорожка (Уклон %)</option>
                <option value="bike" ${cardioType === "bike" ? "selected" : ""}>Велотренажер / Велик (Нагрузка Lvl)</option>
                <option value="ellipse" ${cardioType === "ellipse" ? "selected" : ""}>Эллипс (Тяжесть Lvl)</option>
                <option value="rower" ${cardioType === "rower" ? "selected" : ""}>Гребной тренажер (Тяжесть Lvl)</option>
                <option value="stepper" ${cardioType === "stepper" ? "selected" : ""}>Степпер / Лестница (Уровень Lvl)</option>
                <option value="outdoor" ${cardioType === "outdoor" ? "selected" : ""}>Улица / Манеж (Без тренажера)</option>
              </select>
            </div>
            <div class="form-group" style="flex:1;">
              <label class="form-label">Режим кардио</label>
              <select id="edit-cardio-mode" class="form-select">
                <option value="distance" ${cardioMode === "distance" ? "selected" : ""}>По дистанции (отрезки)</option>
                <option value="time" ${cardioMode === "time" ? "selected" : ""}>На время (свободный результат)</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group" style="flex:1;">
              <label class="form-label">${cardioMode === "time" ? "Целевое время" : "Целевая дистанция"}</label>
              <input type="number" step="${cardioMode === "time" ? (timeUnit === 'hour' ? 0.25 : (timeUnit === 'sec' ? 10 : 1)) : (distUnit === 'm' ? 50 : 0.1)}" id="edit-cardio-target-val" class="form-input" value="${cardioMode === "time" ? (timeUnit === 'sec' ? (exercise.targetSeconds || 1200) : (timeUnit === 'hour' ? (exercise.targetHours || 0.5) : (exercise.targetMinutes || 20))) : (distUnit === 'm' ? (exercise.defaultDistance ? (exercise.defaultDistance < 10 ? Math.round(exercise.defaultDistance * 1000) : exercise.defaultDistance) : 400) : (exercise.defaultDistance ? (exercise.defaultDistance > 50 ? Math.round((exercise.defaultDistance / 1000) * 100) / 100 : exercise.defaultDistance) : 0.4))}">
            </div>
            <div class="form-group" style="flex:1;">
              <label class="form-label">Единица измерения</label>
              ${cardioMode === "time" ? `
                <select id="edit-cardio-time-unit" class="form-select">
                  <option value="min" ${timeUnit === "min" ? "selected" : ""}>Минуты (мин)</option>
                  <option value="sec" ${timeUnit === "sec" ? "selected" : ""}>Секунды (сек)</option>
                  <option value="hour" ${timeUnit === "hour" ? "selected" : ""}>Часы (час)</option>
                </select>
              ` : `
                <select id="edit-cardio-dist-unit" class="form-select">
                  <option value="km" ${distUnit === "km" ? "selected" : ""}>Километры (км)</option>
                  <option value="m" ${distUnit === "m" ? "selected" : ""}>Метры (м)</option>
                </select>
              `}
            </div>
          </div>

          <div class="form-row">
            <div class="form-group" style="flex:1;">
              <label class="form-label">Целевой темп или скорость (интенсивность)</label>
              <input type="text" id="edit-cardio-speed" class="form-input" placeholder="например: 04:20 мин/км или 12.0 км/ч" value="${exercise.targetSpeed || ""}">
              <div style="font-size: 10px; color: #777; margin-top: 3px;">Отображается как бейдж «Темп: ...». Не меняет время в подходах.</div>
            </div>
          </div>

          ${paramMeta.step > 0 ? `
            <div class="form-row">
              <div class="form-group" style="flex:1;">
                <label class="form-label">${paramMeta.name} (${paramMeta.unit || "Lvl"})</label>
                <input type="number" id="edit-cardio-param" class="form-input" value="${exercise[paramMeta.prop] !== undefined ? exercise[paramMeta.prop] : paramMeta.defaultVal}" step="${paramMeta.step}" min="${paramMeta.min}" max="${paramMeta.max}">
              </div>
              <div class="form-group" style="flex:1;">
                <label class="form-label">Отдых между отрезками</label>
                <div style="display: flex; gap: 6px;">
                  <input type="number" id="edit-ex-rest-val" class="form-input" style="flex: 1;" value="${restDisplayVal}" min="0" step="${restDisplayStep}">
                  <select id="edit-ex-rest-unit" class="form-select" style="width: 80px;">
                    <option value="sec" ${restUnit === "sec" ? "selected" : ""}>сек</option>
                    <option value="min" ${restUnit === "min" ? "selected" : ""}>мин</option>
                    <option value="hour" ${restUnit === "hour" ? "selected" : ""}>час</option>
                  </select>
                </div>
              </div>
            </div>
          ` : `
            <div class="form-group">
              <label class="form-label">Отдых между отрезками</label>
              <div style="display: flex; gap: 6px;">
                <input type="number" id="edit-ex-rest-val" class="form-input" style="flex: 1;" value="${restDisplayVal}" min="0" step="${restDisplayStep}">
                <select id="edit-ex-rest-unit" class="form-select" style="width: 80px;">
                  <option value="sec" ${restUnit === "sec" ? "selected" : ""}>сек</option>
                  <option value="min" ${restUnit === "min" ? "selected" : ""}>мин</option>
                  <option value="hour" ${restUnit === "hour" ? "selected" : ""}>час</option>
                </select>
              </div>
            </div>
          `}
        ` : `
          <div class="form-row">
            <div class="form-group" style="flex:1;">
              <label class="form-label">Тип нагрузки</label>
              <select id="edit-strength-mode" class="form-select">
                <option value="reps" ${!exercise.isTimed ? "selected" : ""}>Повторения (повт)</option>
                <option value="timed" ${exercise.isTimed ? "selected" : ""}>Статика / Удержание (сек)</option>
              </select>
            </div>
            <div class="form-group" style="flex:1;">
              <label class="form-label">Целевой объем</label>
              <input type="text" id="edit-ex-reps" class="form-input" value="${exercise.targetReps || (exercise.isTimed ? '40 сек' : '8-10')}">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group" style="flex:1;">
              <label class="form-label">Рабочий вес (кг)</label>
              <input type="number" id="edit-ex-weight" class="form-input" value="${exercise.defaultWeight || 20}">
            </div>
            <div class="form-group" style="flex:1;">
              <label class="form-label">Отдых между подходами</label>
              <div style="display: flex; gap: 6px;">
                <input type="number" id="edit-ex-rest-val" class="form-input" style="flex: 1;" value="${restDisplayVal}" min="0" step="${restDisplayStep}">
                <select id="edit-ex-rest-unit" class="form-select" style="width: 80px;">
                  <option value="sec" ${restUnit === "sec" ? "selected" : ""}>сек</option>
                  <option value="min" ${restUnit === "min" ? "selected" : ""}>мин</option>
                  <option value="hour" ${restUnit === "hour" ? "selected" : ""}>час</option>
                </select>
              </div>
            </div>
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
      exercise.isCardio = false;
      if (exercise.targetReps && /(км|м|сек|мин)/i.test(exercise.targetReps)) {
        exercise.targetReps = "8-10";
      }
      renderEditForm();
    });

    modal.querySelector("#type-cardio-btn").addEventListener("click", () => {
      isCardio = true;
      exercise.isCardio = true;
      if (!exercise.targetReps || !/(км|м|сек|мин)/i.test(exercise.targetReps)) {
        exercise.targetReps = distUnit === "m" ? "400 м" : "0.4 км";
      }
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

    const distUnitSelect = modal.querySelector("#edit-cardio-dist-unit");
    if (distUnitSelect) {
      distUnitSelect.addEventListener("change", (e) => {
        distUnit = e.target.value;
        renderEditForm();
      });
    }

    const timeUnitSelect = modal.querySelector("#edit-cardio-time-unit");
    if (timeUnitSelect) {
      timeUnitSelect.addEventListener("change", (e) => {
        timeUnit = e.target.value;
        renderEditForm();
      });
    }

    modal.querySelector("#edit-save-btn").addEventListener("click", () => {
      const prevWasCardio = Boolean(exercise.isCardio || exercise.category === "Бег" || exercise.category === "Эллипс" || exercise.category === "Вело" || exercise.category === "Кардио");
      exercise.name = modal.querySelector("#edit-ex-name").value.trim() || exercise.name;
      exercise.youtubeUrl = modal.querySelector("#edit-ex-youtube").value.trim();
      exercise.tip = modal.querySelector("#edit-ex-tip").value.trim();

      // Расчет отдыха с учетом выбранной единицы (сек/мин/час)
      const restValEl = modal.querySelector("#edit-ex-rest-val");
      const restUnitEl = modal.querySelector("#edit-ex-rest-unit");
      const rVal = parseFloat(restValEl ? restValEl.value : 0) || 0;
      const rUnit = restUnitEl ? restUnitEl.value : "sec";
      if (rUnit === "hour") {
        exercise.restSeconds = Math.round(rVal * 3600);
      } else if (rUnit === "min") {
        exercise.restSeconds = Math.round(rVal * 60);
      } else {
        exercise.restSeconds = Math.round(rVal);
      }

      exercise.isCardio = isCardio;

      if (isCardio) {
        exercise.cardioType = cardioType;
        exercise.cardioMode = cardioMode;
        exercise.distUnit = distUnit;
        exercise.timeUnit = timeUnit;

        const speedEl = modal.querySelector("#edit-cardio-speed");
        exercise.targetSpeed = speedEl ? speedEl.value.trim() : "";

        const paramEl = modal.querySelector("#edit-cardio-param");
        const paramVal = paramEl ? parseFloat(paramEl.value) : paramMeta.defaultVal;

        if (cardioType === "bike") {
          exercise.bikeLevel = Math.round(paramVal) || 5;
          exercise.category = "Вело";
          exercise.equip = "Велотренажер";
        } else if (cardioType === "ellipse") {
          exercise.resistanceLevel = Math.round(paramVal) || 5;
          exercise.category = "Эллипс";
          exercise.equip = "Эллипс";
        } else if (cardioType === "rower") {
          exercise.rowerLevel = Math.round(paramVal) || 5;
          exercise.category = "Кардио";
          exercise.equip = "Гребной тренажер";
        } else if (cardioType === "stepper") {
          exercise.stepperLevel = Math.round(paramVal) || 5;
          exercise.category = "Кардио";
          exercise.equip = "Степпер";
        } else if (cardioType === "outdoor") {
          exercise.incline = 0;
          exercise.category = "Бег";
          exercise.equip = "Улица / Манеж";
        } else {
          exercise.incline = paramVal || 0;
          exercise.category = "Бег";
          exercise.equip = "Дорожка";
        }

        const targetValEl = modal.querySelector("#edit-cardio-target-val");
        const rawTargetVal = targetValEl ? parseFloat(targetValEl.value) : (cardioMode === "time" ? 20 : 0.4);

        if (cardioMode === "time") {
          if (timeUnit === "sec") {
            exercise.targetSeconds = Math.round(rawTargetVal) || 60;
            exercise.targetReps = `${exercise.targetSeconds} сек`;
          } else if (timeUnit === "hour") {
            exercise.targetHours = rawTargetVal || 0.5;
            exercise.targetReps = `${exercise.targetHours} ч`;
          } else {
            exercise.targetMinutes = Math.round(rawTargetVal) || 20;
            exercise.targetReps = `${exercise.targetMinutes} мин`;
          }
        } else {
          if (distUnit === "m") {
            exercise.defaultDistance = Math.round(rawTargetVal) || 400;
            exercise.targetReps = `${exercise.defaultDistance} м`;
          } else {
            exercise.defaultDistance = Math.round(rawTargetVal * 100) / 100 || 0.4;
            exercise.targetReps = `${exercise.defaultDistance} км`;
          }
        }

        // Сохраняем индивидуально заданные пользователем дистанции и время!
        // Ни в коем случае не стираем введенные вручную 600м, 400м или время отрезка!
        if (exercise.sets) {
          exercise.sets.forEach((s) => {
            if (s.distance === undefined || s.distance === null || s.distance === "") {
              s.distance = exercise.defaultDistance || (distUnit === "m" ? 400 : 0.4);
            }
            if (s.time === undefined || s.time === null || s.time === "") {
              if (cardioMode === "time") {
                s.time = timeUnit === "sec" ? `${exercise.targetSeconds || 60} сек` : (timeUnit === "hour" ? `${exercise.targetHours || 0.5} ч` : `${exercise.targetMinutes || 20} мин`);
              }
            }
            if (paramMeta) {
              if (s[paramMeta.prop] === undefined) s[paramMeta.prop] = paramVal;
              if (s.level === undefined) s.level = paramVal;
            }
          });
        }
      } else {
        exercise.isCardio = false;
        exercise.category = "Силовые";
        exercise.equip = "Снаряд";
        delete exercise.cardioType;
        delete exercise.cardioMode;
        delete exercise.distUnit;
        delete exercise.timeUnit;
        delete exercise.defaultDistance;
        delete exercise.defaultPace;
        delete exercise.targetSpeed;
        delete exercise.targetMinutes;
        delete exercise.targetSeconds;
        delete exercise.targetHours;
        delete exercise.incline;
        delete exercise.bikeLevel;
        delete exercise.resistanceLevel;
        delete exercise.rowerLevel;
        delete exercise.stepperLevel;

        const strengthModeEl = modal.querySelector("#edit-strength-mode");
        if (strengthModeEl) {
          exercise.isTimed = (strengthModeEl.value === "timed");
        }

        const repsEl = modal.querySelector("#edit-ex-reps");
        let rawReps = repsEl ? repsEl.value.trim() : "";
        if (!rawReps || /(км|м)/i.test(rawReps)) rawReps = exercise.isTimed ? "40 сек" : "8-10";
        exercise.targetReps = rawReps;

        const weightEl = modal.querySelector("#edit-ex-weight");
        exercise.defaultWeight = weightEl ? (parseFloat(weightEl.value) || 20) : 20;

        if (exercise.sets) {
          exercise.sets.forEach((s, idx) => {
            s.setNumber = idx + 1;
            s.weight = s.weight !== undefined && !isNaN(parseFloat(s.weight)) ? parseFloat(s.weight) : (exercise.defaultWeight || 20);
            s.reps = s.reps !== undefined && !isNaN(parseInt(s.reps, 10)) ? parseInt(s.reps, 10) : (parseInt(exercise.targetReps, 10) || 8);
            delete s.distance;
            delete s.time;
            delete s.minutes;
            delete s.seconds;
            delete s.hours;
            delete s.incline;
            delete s.level;
            delete s.bikeLevel;
            delete s.resistanceLevel;
            delete s.rowerLevel;
            delete s.stepperLevel;
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
  if (window.ProgramBuilderModal && window.ProgramBuilderModal.openProgramBuilderModal) {
    return window.ProgramBuilderModal.openProgramBuilderModal(existingRoutine, onSave, defaultFolder);
  }
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
