// Модуль для локального сохранения данных в памяти устройства (localStorage)

const STORAGE_KEYS = {
  HISTORY: "gym_tracker_history",
  ACTIVE_SESSION: "gym_tracker_active_session",
  ROUTINES: "gym_tracker_custom_routines",
  FOLDERS: "gym_tracker_custom_folders",
  SETTINGS: "gym_tracker_app_settings",
  PRS: "gym_tracker_prs"
};

/**
 * Получить настройки приложения
 */
function getAppSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return raw ? JSON.parse(raw) : { showAllFolder: true };
  } catch (e) {
    return { showAllFolder: true };
  }
}

/**
 * Сохранить настройки приложения
 */
function saveAppSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error("Ошибка сохранения настроек:", e);
  }
}

/**
 * Получить список папок тренировок для главного меню
 */
function getProgramFolders() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FOLDERS);
    let folders = raw ? JSON.parse(raw) : null;
    if (!folders || !Array.isArray(folders)) {
      folders = ["Все", "Сплит Hyper-Mass", "Бег 3 км", "Мои программы"];
      localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(folders));
    } else {
      if (!folders.includes("Все")) folders.unshift("Все");
    }
    
    const settings = getAppSettings();
    if (settings.showAllFolder === false) {
      folders = folders.filter((f) => f !== "Все");
    }
    return folders;
  } catch (e) {
    return ["Все", "Сплит Hyper-Mass"];
  }
}

/**
 * Сохранить папки тренировок
 */
function saveProgramFolders(folders) {
  try {
    localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(folders));
  } catch (e) {
    console.error("Ошибка сохранения папок:", e);
  }
}

/**
 * Переименовать папку и обновить все входящие в нее программы
 */
function renameProgramFolder(oldName, newName) {
  if (!oldName || !newName || oldName === "Все" || oldName === newName) return false;
  try {
    const folders = getProgramFolders();
    const idx = folders.indexOf(oldName);
    if (idx !== -1) {
      folders[idx] = newName;
      saveProgramFolders(folders);
    }
    const routines = getWorkoutRoutines();
    let updated = false;
    routines.forEach((r) => {
      if (r.folder === oldName) {
        r.folder = newName;
        updated = true;
      }
    });
    if (updated) {
      saveWorkoutRoutines(routines);
    }
    return true;
  } catch (e) {
    console.error("Ошибка переименования папки:", e);
    return false;
  }
}

/**
 * Удалить папку и переместить тренировки в 'Все'
 */
function deleteProgramFolder(folderName) {
  if (!folderName || folderName === "Все") return false;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FOLDERS);
    let folders = [];
    try {
      folders = raw ? JSON.parse(raw) : ["Все", "Сплит Hyper-Mass", "Мои программы"];
    } catch (e) {
      folders = ["Все", "Сплит Hyper-Mass", "Мои программы"];
    }
    if (!folders.includes("Все")) folders.unshift("Все");

    folders = folders.filter((f) => f !== folderName);
    localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(folders));

    const routines = getWorkoutRoutines();
    let updated = false;
    routines.forEach((r) => {
      if (r.folder === folderName) {
        r.folder = "Все";
        updated = true;
      }
    });
    if (updated) {
      saveWorkoutRoutines(routines);
    }
    return true;
  } catch (e) {
    console.error("Ошибка удаления папки:", e);
    return false;
  }
}

/**
 * Сдвинуть папку влево (-1) или вправо (+1) для смены порядка
 */
function moveProgramFolder(folderName, direction) {
  if (!folderName || folderName === "Все") return false;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FOLDERS);
    let folders = raw ? JSON.parse(raw) : ["Все", "Сплит Hyper-Mass", "Бег 3 км", "Мои программы"];
    const idx = folders.indexOf(folderName);
    if (idx === -1) return false;

    const targetIdx = idx + direction;
    const minIdx = folders.includes("Все") ? 1 : 0;
    if (targetIdx < minIdx || targetIdx >= folders.length) return false;

    const temp = folders[idx];
    folders[idx] = folders[targetIdx];
    folders[targetIdx] = temp;

    localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(folders));
    return true;
  } catch (e) {
    console.error("Ошибка сдвига папки:", e);
    return false;
  }
}

/**
 * Получить все программы тренировок (шаблоны сплита + бег + кастомные)
 */
function getWorkoutRoutines() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ROUTINES);
    let routines = raw ? JSON.parse(raw) : null;
    if (!routines || !Array.isArray(routines)) {
      routines = (window.DEFAULT_WORKOUTS || []).slice();
      saveWorkoutRoutines(routines);
      return routines;
    }
    return routines;
  } catch (e) {
    return window.DEFAULT_WORKOUTS || [];
  }
}

/**
 * Сохранить все программы тренировок
 */
function saveWorkoutRoutines(routines) {
  try {
    localStorage.setItem(STORAGE_KEYS.ROUTINES, JSON.stringify(routines));
  } catch (e) {
    console.error("Ошибка сохранения программ:", e);
  }
}

/**
 * Получить историю тренировок
 */
function getWorkoutHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Ошибка загрузки истории:", e);
    return [];
  }
}

/**
 * Сохранить завершенную тренировку в историю
 */
function saveWorkoutToHistory(workoutData) {
  if (!workoutData || !workoutData.completedSetsCount || workoutData.completedSetsCount <= 0) {
    console.log("Тренировка без выполненных подходов не сохраняется.");
    return null;
  }
  try {
    const history = getWorkoutHistory();
    const entry = {
      ...workoutData,
      id: "log_" + Date.now(),
      completedAt: new Date().toISOString()
    };
    history.unshift(entry);
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    clearActiveSession();
    return entry;
  } catch (e) {
    console.error("Ошибка сохранения тренировки:", e);
  }
}

function isExerciseNameMatch(nameA, nameB) {
  if (!nameA || !nameB) return false;
  const a = nameA.toLowerCase().trim();
  const b = nameB.toLowerCase().trim();
  if (a === b) return true;
  if (a.length >= 5 && b.length >= 5) {
    if (a.includes(b) || b.includes(a)) return true;
  }
  const stopWords = new Set(["на", "в", "с", "по", "для", "и", "из", "под"]);
  const wordsA = a.split(/[\s,.-]+/).filter((w) => w.length > 2 && !stopWords.has(w));
  const wordsB = b.split(/[\s,.-]+/).filter((w) => w.length > 2 && !stopWords.has(w));
  if (wordsA.length === 0 || wordsB.length === 0) return false;
  const common = wordsA.filter((w) => wordsB.includes(w));
  if (common.length >= 2) return true;
  if (common.length > 0 && common.length >= Math.min(wordsA.length, wordsB.length)) return true;
  return false;
}

/**
 * Найти последнюю запись по конкретному упражнению (по ID или по названию)
 */
function getLastPerformance(exerciseId, exerciseName) {
  const history = getWorkoutHistory();
  const searchName = exerciseName ? exerciseName.toLowerCase().trim() : null;

  // 1. Точное совпадение
  for (const workout of history) {
    const found = workout.exercises?.find((ex) => 
      (exerciseId && ex.id === exerciseId) || 
      (searchName && ex.name && ex.name.toLowerCase().trim() === searchName)
    );
    if (found && found.sets && found.sets.length > 0) {
      return found.sets;
    }
  }

  // 2. Умное сопоставление ("Жим штанги лежа" <-> "Жим штанги лежа на горизонтальной скамье")
  if (searchName) {
    for (const workout of history) {
      const found = workout.exercises?.find((ex) => 
        ex.name && isExerciseNameMatch(searchName, ex.name)
      );
      if (found && found.sets && found.sets.length > 0) {
        return found.sets;
      }
    }
  }

  return null;
}

/**
 * Получить список ручных рекордов
 */
function getCustomPRs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRS);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

/**
 * Сохранить ручной рекорд
 */
function saveCustomPR(key, prData) {
  try {
    const prs = getCustomPRs();
    prs[key] = prData;
    localStorage.setItem(STORAGE_KEYS.PRS, JSON.stringify(prs));
  } catch (e) {
    console.error("Ошибка сохранения рекорда:", e);
  }
}

/**
 * Удалить ручной рекорд (если случайно ввели не тот вес)
 */
function deleteCustomPR(key) {
  try {
    const prs = getCustomPRs();
    delete prs[key];
    localStorage.setItem(STORAGE_KEYS.PRS, JSON.stringify(prs));
  } catch (e) {
    console.error("Ошибка удаления рекорда:", e);
  }
}

/**
 * Найти пиковый рекорд по упражнению (по ручной фиксации или истории)
 */
function getExercisePR(exerciseId, exerciseName) {
  const prs = getCustomPRs();
  const searchName = exerciseName ? exerciseName.toLowerCase().trim() : null;
  const key = exerciseId || searchName;

  if (key && prs[key] !== undefined) {
    return { ...prs[key], isManual: true };
  }
  if (searchName && prs[searchName] !== undefined) {
    return { ...prs[searchName], isManual: true };
  }

  // Поиск по умному сопоставлению в ручных рекордах
  if (searchName) {
    for (const prKey in prs) {
      const pr = prs[prKey];
      if (pr && pr.name && isExerciseNameMatch(searchName, pr.name)) {
        return { ...pr, isManual: true };
      }
    }
  }

  const history = getWorkoutHistory();
  let maxWeight = 0;
  let maxReps = 0;
  let maxDistance = 0;
  let bestTime = null;

  for (const w of history) {
    const found = w.exercises?.find((ex) => 
      (exerciseId && ex.id === exerciseId) || 
      (searchName && ex.name && (ex.name.toLowerCase().trim() === searchName || isExerciseNameMatch(searchName, ex.name)))
    );
    if (found && found.sets) {
      found.sets.forEach((s) => {
        if (s.completed !== false) {
          const wt = parseFloat(s.weight) || 0;
          const rp = parseInt(s.reps) || 0;
          if (wt > maxWeight || (wt === maxWeight && rp > maxReps)) {
            maxWeight = wt;
            maxReps = rp;
          }
          const dist = parseFloat(s.distance) || 0;
          if (dist > maxDistance) {
            maxDistance = dist;
            bestTime = s.time;
          }
        }
      });
    }
  }

  return {
    weight: maxWeight,
    reps: maxReps,
    distance: maxDistance,
    time: bestTime,
    isManual: false
  };
}

/**
 * Удалить пустые тренировки (0 выполненных подходов)
 */
function purgeEmptyWorkouts() {
  try {
    const history = getWorkoutHistory();
    const cleaned = history.filter((w) => {
      if (!w.completedSetsCount || w.completedSetsCount <= 0) return false;
      const hasSets = w.exercises?.some((ex) => ex.sets && ex.sets.length > 0);
      return Boolean(hasSets);
    });
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(cleaned));
    return history.length - cleaned.length;
  } catch (e) {
    console.error("Ошибка очистки истории:", e);
    return 0;
  }
}

function getActiveSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function saveActiveSession(sessionData) {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(sessionData));
  } catch (e) {
    console.error("Ошибка автосохранения сессии:", e);
  }
}

function clearActiveSession() {
  localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
}

/**
 * Экспорт всех данных в JSON
 */
function exportAllData() {
  return JSON.stringify({
    routines: getWorkoutRoutines(),
    folders: getProgramFolders(),
    history: getWorkoutHistory(),
    exportedAt: new Date().toISOString()
  }, null, 2);
}

/**
 * Импорт всех данных из JSON
 */
function importAllData(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    if (data.routines) saveWorkoutRoutines(data.routines);
    if (data.folders) saveProgramFolders(data.folders);
    if (data.history) localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(data.history));
    return true;
  } catch (e) {
    console.error("Ошибка импорта:", e);
    return false;
  }
}

/**
 * Получить список ТОЛЬКО реальных рекордов пользователя
 */
function getAllUserPRs() {
  const prMap = {};
  const custom = getCustomPRs();
  Object.keys(custom).forEach((k) => {
    const item = custom[k];
    const name = item.name || k;
    prMap[name.toLowerCase()] = {
      key: k,
      name: name,
      weight: item.weight || 0,
      reps: item.reps || 1,
      distance: item.distance || 0,
      time: item.time || null,
      isManual: true,
      updatedAt: item.updatedAt || null
    };
  });

  const history = getWorkoutHistory();
  history.forEach((w) => {
    (w.exercises || []).forEach((ex) => {
      if (!ex.name) return;
      const lower = ex.name.toLowerCase();
      if (!prMap[lower]) {
        prMap[lower] = {
          key: ex.id || lower,
          name: ex.name,
          category: ex.category || (ex.isCardio ? "Бег" : "Силовое"),
          weight: 0,
          reps: 0,
          distance: 0,
          time: null,
          isManual: false,
          updatedAt: w.dateKey || w.completedAt
        };
      }
      (ex.sets || []).forEach((s) => {
        if (s.completed !== false) {
          const wt = parseFloat(s.weight) || 0;
          const rp = parseInt(s.reps) || 0;
          if (wt > prMap[lower].weight || (wt === prMap[lower].weight && rp > prMap[lower].reps)) {
            prMap[lower].weight = wt;
            prMap[lower].reps = rp;
            prMap[lower].updatedAt = w.dateKey || w.completedAt;
          }
          const dst = parseFloat(s.distance) || 0;
          if (dst > prMap[lower].distance) {
            prMap[lower].distance = dst;
            prMap[lower].time = s.time || null;
            prMap[lower].updatedAt = w.dateKey || w.completedAt;
          }
        }
      });
    });
  });

  return Object.values(prMap).filter((item) => item.weight > 0 || item.distance > 0);
}

/**
 * Получить общую статистику: сколько дней занимается, сколько времени провел в зале
 */
function getOverallStats() {
  const history = getWorkoutHistory();
  const realHistory = history.filter((w) => w.completedSetsCount > 0);
  const uniqueDates = new Set();
  let totalMinutes = 0;
  let totalVolumeKg = 0;
  let totalDistanceKm = 0;
  let totalSets = 0;

  realHistory.forEach((w) => {
    const dateKey = w.dateKey || (w.completedAt ? w.completedAt.split("T")[0] : null);
    if (dateKey) uniqueDates.add(dateKey);
    totalMinutes += (w.durationMinutes || 0);
    totalVolumeKg += (w.totalVolumeKg || 0);
    totalDistanceKm += (w.totalDistanceKm || 0);
    totalSets += (w.completedSetsCount || 0);
  });

  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const timeFormatted = hours > 0 ? `${hours} ч. ${mins} мин.` : `${mins} мин.`;

  return {
    totalWorkouts: realHistory.length,
    uniqueDays: uniqueDates.size,
    totalMinutes,
    timeFormatted,
    totalVolumeKg: Math.round(totalVolumeKg),
    totalDistanceKm: Math.round(totalDistanceKm * 10) / 10,
    totalSets
  };
}

/**
 * Вручную закрыть день / добавить тренировку в выбранную дату
 */
function addManualWorkoutToDate(dateKey, data) {
  try {
    const history = getWorkoutHistory();
    const entry = {
      id: "log_manual_" + Date.now(),
      title: data.title || "Тренировка",
      subtitle: data.subtitle || "Внесено вручную",
      isRun: Boolean(data.isRun),
      durationMinutes: parseInt(data.durationMinutes) || 60,
      completedSetsCount: parseInt(data.completedSetsCount) || (data.exercises ? data.exercises.reduce((acc, e) => acc + (e.sets ? e.sets.length : 0), 0) : 3),
      totalVolumeKg: parseInt(data.totalVolumeKg) || 0,
      totalDistanceKm: parseFloat(data.totalDistanceKm) || 0,
      dateKey: dateKey,
      completedAt: `${dateKey}T12:00:00.000Z`,
      exercises: data.exercises || []
    };
    history.unshift(entry);
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    return entry;
  } catch (e) {
    console.error("Ошибка добавления тренировки вручную:", e);
    return null;
  }
}

/**
 * Синхронизировать упражнения тренировки в шаблон программы
 */
function updateRoutineExercises(routineId, exercises) {
  if (!routineId) return false;
  try {
    const routines = getWorkoutRoutines();
    const routine = routines.find((r) => r.id === routineId);
    if (routine) {
      routine.exercises = (exercises || []).map((ex) => ({
        id: ex.id || "ex_" + Date.now(),
        name: ex.name,
        category: ex.category || "Силовые",
        equip: ex.equip || "Снаряд",
        targetReps: ex.targetReps || "8-10",
        defaultWeight: ex.sets && ex.sets[0] && ex.sets[0].weight !== undefined ? ex.sets[0].weight : (ex.defaultWeight || 20),
        setsCount: ex.sets ? ex.sets.length : (ex.setsCount || 3),
        isCardio: Boolean(ex.isCardio),
        tip: ex.tip || ""
      }));
      saveWorkoutRoutines(routines);
      return true;
    }
    return false;
  } catch (e) {
    console.error("Ошибка синхронизации упражнений программы:", e);
    return false;
  }
}

window.StorageModule = {
  getAppSettings,
  saveAppSettings,
  getProgramFolders,
  saveProgramFolders,
  renameProgramFolder,
  deleteProgramFolder,
  moveProgramFolder,
  getWorkoutRoutines,
  getUserRoutines: getWorkoutRoutines,
  saveWorkoutRoutines,
  saveUserRoutine: saveWorkoutRoutines,
  updateRoutineExercises,
  getWorkoutHistory,
  saveWorkoutToHistory,
  getLastPerformance,
  getCustomPRs,
  saveCustomPR,
  deleteCustomPR,
  getExercisePR,
  getAllUserPRs,
  getOverallStats,
  addManualWorkoutToDate,
  purgeEmptyWorkouts,
  getActiveSession,
  saveActiveSession,
  clearActiveSession,
  exportAllData,
  importAllData
};
