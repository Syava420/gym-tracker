// Модуль экрана "Рекорды": отображение ТОЛЬКО реальных личных рекордов пользователя и их добавление

let recordsSearchQuery = "";

function renderExercisesView(container) {
  container.innerHTML = "";

  const prs = window.StorageModule.getAllUserPRs();
  const q = recordsSearchQuery.toLowerCase().trim();
  const filtered = prs.filter((p) => !q || p.name.toLowerCase().includes(q));

  const wrapper = document.createElement("div");
  wrapper.className = "exercises-view-wrapper";
  wrapper.innerHTML = `
    <div class="records-header-box">
      <div>
        <h2 class="view-screen-title">Мои рекорды (PR)</h2>
        <div class="ev-subtitle">${prs.length > 0 ? `Зафиксировано: ${prs.length} рекордов` : "Здесь только ваши личные максимумы"}</div>
      </div>
      <button type="button" class="btn-primary-dark" id="btn-add-record-top">+ Добавить рекорд</button>
    </div>

    ${prs.length > 3 ? `
      <div class="ev-search-box">
        <input type="text" class="form-input ev-search-input" id="records-search-input" placeholder="Поиск по своим рекордам..." value="${recordsSearchQuery}">
        ${recordsSearchQuery ? '<button type="button" class="btn-clear-search" id="btn-clear-records-search">✕</button>' : ""}
      </div>
    ` : ""}

    <div class="records-list" id="records-list"></div>
  `;

  // Кнопка добавления нового рекорда
  wrapper.querySelector("#btn-add-record-top").addEventListener("click", () => {
    openAddRecordModal(() => renderExercisesView(container));
  });

  // Поиск среди своих рекордов
  const searchInput = wrapper.querySelector("#records-search-input");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      recordsSearchQuery = e.target.value;
      renderRecordsCards(wrapper.querySelector("#records-list"), prs, () => renderExercisesView(container));
    });
    const clearBtn = wrapper.querySelector("#btn-clear-records-search");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        recordsSearchQuery = "";
        renderExercisesView(container);
      });
    }
  }

  // Отрисовка списка карточек
  renderRecordsCards(wrapper.querySelector("#records-list"), filtered, () => renderExercisesView(container));

  container.appendChild(wrapper);
}

/**
 * Отрисовка карточек рекордов
 */
function renderRecordsCards(listContainer, prs, onRefresh) {
  listContainer.innerHTML = "";

  if (prs.length === 0) {
    listContainer.innerHTML = `
      <div class="records-empty-box">
        <div class="reb-title">Личных рекордов пока нет</div>
        <div class="reb-desc">
          Рекорды фиксируются автоматически, когда вы выполняете подходы на тренировках. Также вы можете внести свои текущие рабочие веса вручную.
        </div>
        <button type="button" class="btn-primary-dark" id="btn-add-first-record">+ Добавить свой первый рекорд</button>
      </div>
    `;

    listContainer.querySelector("#btn-add-first-record").addEventListener("click", () => {
      openAddRecordModal(onRefresh);
    });
    return;
  }

  prs.forEach((pr) => {
    const isCardio = Boolean(pr.distance > 0);
    const valText = isCardio ? `${pr.distance} км ${pr.time ? `(${pr.time})` : ""}` : `${pr.weight} кг × ${pr.reps || 1}`;
    const dateFormatted = pr.updatedAt ? (pr.updatedAt.includes("-") ? pr.updatedAt.split("T")[0].split("-").reverse().join(".") : pr.updatedAt) : "Недавно";
    const videoUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent("техника " + pr.name)}`;

    const card = document.createElement("div");
    card.className = "record-card-item";
    card.innerHTML = `
      <div class="rci-left">
        <div class="rci-top-line">
          <a href="${videoUrl}" target="_blank" class="rci-name" title="Смотреть технику на YouTube">${pr.name}</a>
          <a href="${videoUrl}" target="_blank" class="rci-video-link" title="Видео техники">Видео</a>
        </div>
        <div class="rci-badges">
          <span class="rci-value-badge">PR: ${valText}</span>
          <span class="rci-date-badge">${dateFormatted}</span>
        </div>
      </div>
      <div class="rci-actions">
        <button type="button" class="btn-sf-tool btn-edit-pr" title="Изменить вес или повторения" style="font-size: 10px; font-weight: 700;">Ред.</button>
        <button type="button" class="btn-sf-tool btn-del-pr" title="Сбросить рекорд">✕</button>
      </div>
    `;

    // Редактирование
    card.querySelector(".btn-edit-pr").addEventListener("click", () => {
      if (isCardio) {
        const nextDist = prompt(`Рекордная дистанция (км) для «${pr.name}»:`, pr.distance);
        if (nextDist !== null) {
          const parsed = parseFloat(nextDist);
          if (!isNaN(parsed) && parsed > 0) {
            const nextTime = prompt("Время / темп:", pr.time || "04:30");
            window.StorageModule.saveCustomPR(pr.key, {
              ...pr,
              distance: parsed,
              time: nextTime || "—",
              updatedAt: new Date().toISOString()
            });
            if (onRefresh) onRefresh();
          }
        }
      } else {
        const nextWeight = prompt(`Рекордный рабочий вес (кг) для «${pr.name}»:`, pr.weight);
        if (nextWeight !== null) {
          const parsed = parseFloat(nextWeight);
          if (!isNaN(parsed) && parsed >= 0) {
            const nextReps = prompt("Количество повторений:", pr.reps || 1);
            window.StorageModule.saveCustomPR(pr.key, {
              ...pr,
              weight: parsed,
              reps: parseInt(nextReps) || 1,
              updatedAt: new Date().toISOString()
            });
            if (onRefresh) onRefresh();
          }
        }
      }
    });

    // Сброс
    card.querySelector(".btn-del-pr").addEventListener("click", () => {
      if (confirm(`Сбросить личный рекорд для «${pr.name}»?`)) {
        window.StorageModule.deleteCustomPR(pr.key);
        window.StorageModule.deleteCustomPR(pr.name.toLowerCase().trim());
        if (onRefresh) onRefresh();
      }
    });

    listContainer.appendChild(card);
  });
}

/**
 * Модальное окно добавления нового рекорда
 */
function openAddRecordModal(onSaved) {
  let modal = document.getElementById("add-record-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "add-record-modal";
    modal.className = "modal-overlay";
    document.body.appendChild(modal);
  }

  const catalog = window.EXERCISE_CATALOG || [];

  modal.innerHTML = `
    <div class="modal-card">
      <div class="modal-header">
        <span class="modal-title">+ Новый личный рекорд</span>
        <button type="button" class="modal-close" id="record-close-btn">✕</button>
      </div>

      <div class="form-group">
        <label class="form-label">Выберите упражнение из базы</label>
        <select id="record-ex-select" class="form-input">
          <option value="custom">Свое упражнение (ввести вручную)</option>
          ${catalog.map((c) => `<option value="${c.id}" data-name="${c.name}" data-cardio="${Boolean(c.isCardio || c.category === "Бег" || c.category === "Эллипс" || c.category === "Вело")}">${c.name} (${c.category})</option>`).join("")}
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Название упражнения</label>
        <input type="text" id="record-name-input" class="form-input" placeholder="Например: Жим штанги лежа...">
      </div>

      <div class="form-group" style="display:flex; gap:10px;">
        <div style="flex:1;">
          <label class="form-label" id="record-val1-label">Вес (кг)</label>
          <input type="number" id="record-val1-input" class="form-input" value="60" step="2.5" min="0">
        </div>
        <div style="flex:1;">
          <label class="form-label" id="record-val2-label">Повторений</label>
          <input type="number" id="record-val2-input" class="form-input" value="6" min="1">
        </div>
      </div>

      <div class="modal-actions" style="margin-top: 14px;">
        <button type="button" id="record-save-btn" class="btn-primary-full">Зафиксировать рекорд</button>
      </div>
    </div>
  `;

  modal.classList.add("visible");

  modal.querySelector("#record-close-btn").addEventListener("click", () => {
    modal.classList.remove("visible");
  });

  const select = modal.querySelector("#record-ex-select");
  const nameInput = modal.querySelector("#record-name-input");
  const val1Label = modal.querySelector("#record-val1-label");
  const val1Input = modal.querySelector("#record-val1-input");
  const val2Label = modal.querySelector("#record-val2-label");
  const val2Input = modal.querySelector("#record-val2-input");

  select.addEventListener("change", () => {
    const opt = select.selectedOptions[0];
    if (select.value === "custom") {
      nameInput.value = "";
      val1Label.textContent = "Вес (кг)";
      val2Label.textContent = "Повторений";
      val1Input.value = 60;
      val2Input.value = 6;
      val2Input.type = "number";
    } else {
      nameInput.value = opt.dataset.name;
      const isCardio = opt.dataset.cardio === "true";
      if (isCardio) {
        val1Label.textContent = "Дистанция (км)";
        val2Label.textContent = "Время / темп";
        val1Input.value = 3.0;
        val2Input.type = "text";
        val2Input.value = "04:20";
      } else {
        val1Label.textContent = "Вес (кг)";
        val2Label.textContent = "Повторений";
        val1Input.value = 60;
        val2Input.type = "number";
        val2Input.value = 6;
      }
    }
  });

  modal.querySelector("#record-save-btn").addEventListener("click", () => {
    const name = nameInput.value.trim();
    if (!name) {
      alert("Укажите название упражнения.");
      return;
    }

    const opt = select.selectedOptions[0];
    const isCardio = opt && opt.dataset.cardio === "true";
    const key = select.value !== "custom" ? select.value : name.toLowerCase().trim();

    if (isCardio) {
      const dist = parseFloat(val1Input.value) || 1.0;
      const time = val2Input.value.trim() || "04:20";
      window.StorageModule.saveCustomPR(key, {
        name,
        distance: dist,
        time,
        updatedAt: new Date().toISOString()
      });
    } else {
      const weight = parseFloat(val1Input.value) || 0;
      const reps = parseInt(val2Input.value) || 1;
      window.StorageModule.saveCustomPR(key, {
        name,
        weight,
        reps,
        updatedAt: new Date().toISOString()
      });
    }

    modal.classList.remove("visible");
    if (onSaved) onSaved();
  });
}

window.ExercisesView = {
  renderExercisesView,
  openAddRecordModal
};
