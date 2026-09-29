// program-builder-modal.js
// Полноценный конструктор тренировок: создание/редактирование программы и её списка упражнений

function openProgramBuilderModal(existingRoutine, onSave, defaultFolder) {
  let modal = document.getElementById("program-builder-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "program-builder-modal";
    modal.className = "modal-overlay";
    document.body.appendChild(modal);
  }

  const isEdit = Boolean(existingRoutine);
  const folders = (window.StorageModule && window.StorageModule.getProgramFolders()) || ["Все"];
  const targetFolder = isEdit
    ? (existingRoutine.folder || "Все")
    : (defaultFolder || (folders[0] || "Все"));

  // Создаем изолированный черновик для редактирования
  const draft = existingRoutine
    ? JSON.parse(JSON.stringify(existingRoutine))
    : {
        id: "custom-" + Date.now(),
        title: "",
        subtitle: "",
        tag: "ТР",
        folder: targetFolder,
        exercises: []
      };

  draft.exercises = draft.exercises || [];

  function renderModal() {
    modal.innerHTML = `
      <div class="modal-card" style="max-height: 90vh;">
        <div class="modal-header">
          <span class="modal-title">${isEdit ? "Конструктор программы" : "Новая тренировка"}</span>
          <button type="button" class="modal-close" id="pbm-close-btn">✕</button>
        </div>

        <div style="overflow-y: auto; padding-right: 2px; flex: 1;">
          <div class="form-group">
            <label class="form-label">Название тренировки</label>
            <input type="text" id="pbm-title" class="form-input" value="${draft.title || ""}" placeholder="Например: Спина + Бицепс или Бег 3 км">
          </div>

          <div class="form-group">
            <label class="form-label">Описание / Мышечные группы</label>
            <input type="text" id="pbm-sub" class="form-input" value="${draft.subtitle || ""}" placeholder="Например: Широчайшие, хват, бицепс">
          </div>

          <div class="form-row">
            <div class="form-group" style="flex: 1;">
              <label class="form-label">Тег (ПН, ВТ...)</label>
              <input type="text" id="pbm-tag" class="form-input" value="${draft.tag || "ТР"}" maxlength="5">
            </div>
            <div class="form-group" style="flex: 2;">
              <label class="form-label">Папка</label>
              <select id="pbm-folder" class="form-select">
                ${folders.map((f) => `
                  <option value="${f}" ${draft.folder === f ? "selected" : ""}>${f}</option>
                `).join("")}
              </select>
            </div>
          </div>

          <div style="margin-top: 14px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
            <span class="form-label" style="margin: 0;">Упражнения в тренировке (${draft.exercises.length})</span>
            <button type="button" class="btn-text-action" id="pbm-add-ex-top">+ Добавить</button>
          </div>

          <div class="pbm-exercises-list" id="pbm-exercises-list">
            ${draft.exercises.length === 0 ? `
              <div class="empty-builder-box">
                <div style="font-size: 13px; color: #888888; margin-bottom: 8px;">В этой программе пока нет упражнений</div>
                <div style="font-size: 11px; color: #666666;">Нажмите кнопку ниже, чтобы собрать тренировку из базы упражнений</div>
              </div>
            ` : draft.exercises.map((ex, idx) => {
              const isCardio = window.CardioHelper ? window.CardioHelper.isCardioExercise(ex) : Boolean(ex.isCardio);
              const setsCount = (ex.sets && ex.sets.length) || 3;
              const targetStr = ex.targetReps || (isCardio ? (ex.distUnit === "m" ? (ex.defaultDistance || 400) + " м" : (ex.defaultDistance || 0.4) + " км") : "10-12");
              const speedStr = ex.targetSpeed ? ` • Темп: ${ex.targetSpeed}` : "";
              return `
                <div class="pbm-ex-item" data-index="${idx}">
                  <div class="pbm-ex-info">
                    <div class="pbm-ex-name">${idx + 1}. ${ex.name}</div>
                    <div class="pbm-ex-meta">
                      <span class="badge-cat">${isCardio ? "Кардио" : (ex.category || "Силовые")}</span>
                      <span>${setsCount} ${isCardio ? "отрезка" : "подх."} по ${targetStr}${speedStr}</span>
                    </div>
                  </div>
                  <div class="pbm-ex-actions">
                    <button type="button" class="btn-pbm-tool btn-pbm-up" data-index="${idx}" ${idx === 0 ? "disabled" : ""} title="Выше">↑</button>
                    <button type="button" class="btn-pbm-tool btn-pbm-down" data-index="${idx}" ${idx === draft.exercises.length - 1 ? "disabled" : ""} title="Ниже">↓</button>
                    <button type="button" class="btn-pbm-tool btn-pbm-edit" data-index="${idx}" title="Параметры">Ред.</button>
                    <button type="button" class="btn-pbm-tool btn-pbm-del" data-index="${idx}" title="Удалить">✕</button>
                  </div>
                </div>
              `;
            }).join("")}
          </div>

          <button type="button" class="btn-add-exercise" id="pbm-btn-add-ex" style="margin-top: 10px; margin-bottom: 14px;">
            + Добавить упражнение
          </button>
        </div>

        <div class="modal-actions" style="margin-top: 10px;">
          <button type="button" id="pbm-save-btn" class="btn-primary-full">
            ${isEdit ? "Сохранить программу" : "Создать программу"}
          </button>
        </div>
      </div>
    `;

    modal.classList.add("visible");

    // Закрытие
    const close = () => modal.classList.remove("visible");
    modal.querySelector("#pbm-close-btn").addEventListener("click", close);

    // Слушатели полей
    const titleInput = modal.querySelector("#pbm-title");
    titleInput.addEventListener("input", (e) => {
      draft.title = e.target.value;
    });

    const subInput = modal.querySelector("#pbm-sub");
    subInput.addEventListener("input", (e) => {
      draft.subtitle = e.target.value;
    });

    const tagInput = modal.querySelector("#pbm-tag");
    tagInput.addEventListener("input", (e) => {
      draft.tag = e.target.value;
    });

    const folderSelect = modal.querySelector("#pbm-folder");
    folderSelect.addEventListener("change", (e) => {
      draft.folder = e.target.value;
    });

    // Добавление упражнения
    const handleAddExercise = () => {
      if (window.ModalsModule && window.ModalsModule.openAddExerciseModal) {
        window.ModalsModule.openAddExerciseModal((newEx) => {
          draft.exercises.push(newEx);
          renderModal();
        });
      }
    };

    const addTopBtn = modal.querySelector("#pbm-add-ex-top");
    if (addTopBtn) addTopBtn.addEventListener("click", handleAddExercise);

    const addBottomBtn = modal.querySelector("#pbm-btn-add-ex");
    if (addBottomBtn) addBottomBtn.addEventListener("click", handleAddExercise);

    // Действия над упражнениями: вверх/вниз/редактировать/удалить
    modal.querySelectorAll(".btn-pbm-up").forEach((b) => {
      b.addEventListener("click", () => {
        const i = parseInt(b.dataset.index, 10);
        if (i > 0) {
          const tmp = draft.exercises[i];
          draft.exercises[i] = draft.exercises[i - 1];
          draft.exercises[i - 1] = tmp;
          renderModal();
        }
      });
    });

    modal.querySelectorAll(".btn-pbm-down").forEach((b) => {
      b.addEventListener("click", () => {
        const i = parseInt(b.dataset.index, 10);
        if (i < draft.exercises.length - 1) {
          const tmp = draft.exercises[i];
          draft.exercises[i] = draft.exercises[i + 1];
          draft.exercises[i + 1] = tmp;
          renderModal();
        }
      });
    });

    modal.querySelectorAll(".btn-pbm-del").forEach((b) => {
      b.addEventListener("click", () => {
        const i = parseInt(b.dataset.index, 10);
        draft.exercises.splice(i, 1);
        renderModal();
      });
    });

    modal.querySelectorAll(".btn-pbm-edit").forEach((b) => {
      b.addEventListener("click", () => {
        const i = parseInt(b.dataset.index, 10);
        const ex = draft.exercises[i];
        if (window.ModalsModule && window.ModalsModule.openEditExerciseModal) {
          window.ModalsModule.openEditExerciseModal(ex, (updatedEx) => {
            draft.exercises[i] = updatedEx;
            renderModal();
          });
        }
      });
    });

    // Сохранение
    modal.querySelector("#pbm-save-btn").addEventListener("click", () => {
      const finalTitle = (draft.title || "").trim();
      if (!finalTitle) {
        alert("Пожалуйста, укажите название тренировки!");
        return;
      }
      draft.title = finalTitle;
      draft.subtitle = (draft.subtitle || "").trim();
      draft.tag = (draft.tag || "ТР").trim();

      close();
      if (onSave) onSave(draft);
    });
  }

  renderModal();
}

window.ProgramBuilderModal = {
  openProgramBuilderModal
};
