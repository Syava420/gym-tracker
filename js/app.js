// Главный контроллер: жизненный цикл приложения, навигация, секундомер и завершение тренировки

let currentView = "home"; // "home", "workout", "history"
let activeWorkout = null;
let sessionStartTime = null;
let workoutStopwatchInterval = null;

document.addEventListener("DOMContentLoaded", () => {
  initDOM();
  checkExistingSession();
  render();

  const urlParams = new URLSearchParams(window.location.search);
  const viewParam = urlParams.get("view");
  if (viewParam) {
    if (viewParam === "cardio") {
      const routine = (window.DEFAULT_WORKOUTS || []).find((r) => r.folder === "Бег 3 км") || window.DEFAULT_WORKOUTS[0];
      if (routine) startNewWorkout(routine);
    } else {
      switchView(viewParam);
    }
  }
});

function initDOM() {
  const settings = window.StorageModule.getAppSettings();
  const offset = settings.bottomNavOffset !== undefined ? settings.bottomNavOffset : 8;
  document.documentElement.style.setProperty("--bottom-nav-offset", offset + "px");

  document.getElementById("btn-home").addEventListener("click", () => switchView("home"));
  const btnRecords = document.getElementById("btn-records");
  if (btnRecords) btnRecords.addEventListener("click", () => switchView("records"));
  document.getElementById("btn-history").addEventListener("click", () => switchView("history"));
  const btnSettings = document.getElementById("btn-settings");
  if (btnSettings) btnSettings.addEventListener("click", () => switchView("settings"));

  document.getElementById("timer-add-btn").addEventListener("click", () => {
    window.TimerModule.addTimerSeconds(30);
  });

  document.getElementById("timer-skip-btn").addEventListener("click", () => {
    window.TimerModule.stopRestTimer();
    updateTimerUI(0);
  });
}

function checkExistingSession() {
  const saved = window.StorageModule.getActiveSession();
  if (saved && saved.workout && saved.startTime) {
    activeWorkout = saved.workout;
    sessionStartTime = saved.startTime;
    currentView = "workout";
    startWorkoutStopwatch();
  }
}

function switchView(viewName) {
  currentView = viewName;
  updateNavUI();
  render();
}

window.switchView = switchView;
window.startNewWorkout = startNewWorkout;

function updateNavUI() {
  const homeBtn = document.getElementById("btn-home");
  const recBtn = document.getElementById("btn-records");
  const histBtn = document.getElementById("btn-history");
  const setBtn = document.getElementById("btn-settings");

  if (homeBtn) homeBtn.classList.toggle("active", currentView === "home" || currentView === "workout");
  if (recBtn) recBtn.classList.toggle("active", currentView === "records");
  if (histBtn) histBtn.classList.toggle("active", currentView === "history");
  if (setBtn) setBtn.classList.toggle("active", currentView === "settings");
}

function render() {
  const container = document.getElementById("app-content");
  container.innerHTML = "";

  if (currentView === "home") {
    stopWorkoutStopwatch();
    window.HomeView.renderHomeView(
      container,
      (routine) => startNewWorkout(routine),
      () => switchView("workout"),
      () => cancelActiveWorkout()
    );
  } else if (currentView === "workout") {
    if (sessionStartTime) {
      startWorkoutStopwatch();
    } else {
      stopWorkoutStopwatch();
    }
    window.WorkoutView.renderWorkoutView(container, {
      workout: activeWorkout,
      sessionStartTime: sessionStartTime,
      onBack: () => switchView("home"),
      onFinish: () => finishWorkout(),
      onCancel: () => cancelActiveWorkout(),
      onStartTimer: (time) => {
        sessionStartTime = time;
        if (activeWorkout) activeWorkout.startTime = time;
        startWorkoutStopwatch();
        window.StorageModule.saveActiveSession({ workout: activeWorkout, startTime: sessionStartTime });
      },
      onSaveSession: () => {
        window.StorageModule.saveActiveSession({ workout: activeWorkout, startTime: sessionStartTime });
      },
      onTriggerRest: (seconds) => triggerRestTimer(seconds),
      onRerender: () => render()
    });
  } else if (currentView === "records") {
    stopWorkoutStopwatch();
    window.ExercisesView.renderExercisesView(container);
  } else if (currentView === "history") {
    stopWorkoutStopwatch();
    window.HistoryView.renderHistoryCalendarView(container);
  } else if (currentView === "settings") {
    stopWorkoutStopwatch();
    window.SettingsView.renderSettingsView(container);
  }
}

function cancelActiveWorkout() {
  stopWorkoutStopwatch();
  window.TimerModule.stopRestTimer();
  updateTimerUI(0);
  activeWorkout = null;
  sessionStartTime = null;
  window.StorageModule.clearActiveSession();
  switchView("home");
}

// ----------------------------------------------------
// ОБЩИЙ СЕКУНДОМЕР ТРЕНИРОВКИ
// ----------------------------------------------------
function startWorkoutStopwatch() {
  if (workoutStopwatchInterval) return;
  workoutStopwatchInterval = setInterval(updateStopwatchDisplay, 1000);
}

function stopWorkoutStopwatch() {
  if (workoutStopwatchInterval) {
    clearInterval(workoutStopwatchInterval);
    workoutStopwatchInterval = null;
  }
}

function updateStopwatchDisplay() {
  const el = document.getElementById("workout-stopwatch");
  if (!el) return;
  if (!sessionStartTime) {
    el.textContent = "00:00";
    return;
  }
  const elapsedSec = Math.floor((Date.now() - sessionStartTime) / 1000);
  const m = Math.floor(elapsedSec / 60);
  const s = elapsedSec % 60;
  el.textContent = `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
}

// ----------------------------------------------------
// СТАРТ И ФИНИШ ТРЕНИРОВКИ
// ----------------------------------------------------
function startNewWorkout(routineData) {
  activeWorkout = {
    templateId: routineData.id,
    title: routineData.title,
    subtitle: routineData.subtitle,
    isRun: Boolean(routineData.isRun || routineData.folder === "Бег 3 км"),
    exercises: (routineData.exercises || []).map((ex) => {
      const isCardio = Boolean(ex.isCardio || ex.category === "Бег" || ex.category === "Эллипс");
      const lastSets = window.StorageModule.getLastPerformance(ex.id, ex.name);
      const isBodyweight = Boolean(
        ex.equip === "Свой вес" || 
        ex.category === "Пресс" || 
        ex.defaultWeight === 0 ||
        (ex.name && (
          ex.name.toLowerCase().includes("вис") || 
          ex.name.toLowerCase().includes("подтягиван") || 
          ex.name.toLowerCase().includes("отжиман") || 
          ex.name.toLowerCase().includes("брусь") || 
          ex.name.toLowerCase().includes("планк")
        ))
      );
      const initialSets = [];
      const count = ex.setsCount || (ex.sets ? ex.sets.length : 3);

      for (let i = 0; i < count; i++) {
        const prevSet = lastSets && lastSets[i] ? lastSets[i] : (lastSets && lastSets[0] ? lastSets[0] : null);

        if (isCardio) {
          const prevDist = prevSet && prevSet.distance !== undefined ? prevSet.distance : (ex.defaultDistance || 0.4);
          const prevTime = prevSet && prevSet.time ? prevSet.time : (ex.defaultPace || "04:20");
          initialSets.push({
            setNumber: i + 1,
            distance: prevDist,
            time: prevTime,
            completed: false,
            prevInfo: prevSet ? `${prevSet.distance} км (${prevSet.time})` : null
          });
        } else {
          let initialWeight = isBodyweight ? 0 : 20;
          const exPR = window.StorageModule.getExercisePR(ex.id, ex.name);
          if (prevSet && prevSet.weight !== undefined) {
            initialWeight = prevSet.weight;
          } else if (!isBodyweight && exPR && exPR.weight > 0) {
            initialWeight = exPR.weight;
          } else if (ex.defaultWeight !== undefined) {
            initialWeight = isBodyweight ? 0 : ex.defaultWeight;
          }
          const initialReps = prevSet && prevSet.reps ? prevSet.reps : (parseInt(ex.targetReps) || 8);
          initialSets.push({
            setNumber: i + 1,
            weight: initialWeight,
            reps: initialReps,
            completed: false,
            prevInfo: prevSet ? `${prevSet.weight}×${prevSet.reps}` : (exPR && exPR.weight ? `PR:${exPR.weight}` : null)
          });
        }
      }

      return {
        ...ex,
        sets: initialSets
      };
    })
  };

  sessionStartTime = null;
  stopWorkoutStopwatch();
  window.StorageModule.saveActiveSession({ workout: activeWorkout, startTime: null });
  switchView("workout");
}

function finishWorkout() {
  let completedCount = 0;
  let totalVolumeKg = 0;
  let totalDistanceKm = 0;
  const isRunWorkout = activeWorkout.isRun || activeWorkout.exercises.some((e) => e.isCardio);

  activeWorkout.exercises.forEach((ex) => {
    const isCardio = Boolean(ex.isCardio || ex.category === "Бег" || ex.category === "Эллипс");
    ex.sets.filter((s) => s.completed).forEach((s) => {
      completedCount++;
      if (isCardio) {
        totalDistanceKm += parseFloat(s.distance) || 0;
      } else {
        totalVolumeKg += (s.weight || 0) * (s.reps || 0);
      }
    });
  });

  let durationMin = Math.round((Date.now() - sessionStartTime) / 60000) || 1;

  // Умный расчет времени, если забыл завершить вовремя
  let latestCompletedTimestamp = null;
  activeWorkout.exercises.forEach((ex) => {
    (ex.sets || []).forEach((s) => {
      if (s.completed && s.completedAt) {
        if (!latestCompletedTimestamp || s.completedAt > latestCompletedTimestamp) {
          latestCompletedTimestamp = s.completedAt;
        }
      }
    });
  });

  if (latestCompletedTimestamp && durationMin >= 75) {
    const activeSetsDurationMin = Math.max(1, Math.round((latestCompletedTimestamp - sessionStartTime) / 60000));
    if (durationMin - activeSetsDurationMin >= 25) {
      const useCalculated = confirm(
        `Похоже, вы забыли нажать «Завершить» вовремя.\n\nВремя по секундомеру: ${durationMin} мин.\nВремя по последнему подходу: ${activeSetsDurationMin} мин.\n\nЗаписать реальное время тренировки (${activeSetsDurationMin} мин)?`
      );
      if (useCalculated) {
        durationMin = activeSetsDurationMin;
      }
    }
  }

  const now = new Date();
  const dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const log = {
    title: activeWorkout.title,
    subtitle: activeWorkout.subtitle,
    isRun: isRunWorkout,
    durationMinutes: durationMin,
    completedSetsCount: completedCount,
    totalVolumeKg: Math.round(totalVolumeKg),
    totalDistanceKm: Math.round(totalDistanceKm * 100) / 100,
    dateKey: dateKey,
    exercises: activeWorkout.exercises.map((ex) => ({
      id: ex.id,
      name: ex.name,
      isCardio: Boolean(ex.isCardio || ex.category === "Бег" || ex.category === "Эллипс"),
      sets: ex.sets.filter((s) => s.completed)
    }))
  };

  window.StorageModule.saveWorkoutToHistory(log);
  stopWorkoutStopwatch();
  window.TimerModule.stopRestTimer();
  updateTimerUI(0);
  activeWorkout = null;
  window.StorageModule.clearActiveSession();

  if (isRunWorkout) {
    alert(`Кардио/Беговая тренировка завершена!\nВремя: ${durationMin} мин.\nОтрезков: ${completedCount}\nОбщая дистанция: ${Math.round(totalDistanceKm * 100) / 100} км`);
  } else {
    alert(`Тренировка завершена!\nВремя: ${durationMin} мин.\nПодходов: ${completedCount}\nПоднятый тоннаж: ${totalVolumeKg} кг`);
  }
  switchView("history");
}

// ----------------------------------------------------
// ТАЙМЕР ОТДЫХА МЕЖДУ СЕТАМИ / ОТРЕЗКАМИ
// ----------------------------------------------------
function triggerRestTimer(seconds) {
  window.TimerModule.startRestTimer(
    seconds,
    (remaining) => updateTimerUI(remaining),
    () => onTimerFinished()
  );
}

function updateTimerUI(remaining) {
  const panel = document.getElementById("rest-timer-panel");
  const digits = document.getElementById("timer-digits");
  if (!panel || !digits) return;

  if (remaining <= 0 || !window.TimerModule.isTimerRunning()) {
    panel.classList.add("hidden");
    return;
  }

  panel.classList.remove("hidden");
  digits.textContent = window.TimerModule.formatTime(remaining);
}

function onTimerFinished() {
  const panel = document.getElementById("rest-timer-panel");
  const digits = document.getElementById("timer-digits");
  if (!panel || !digits) return;

  panel.classList.remove("hidden");
  digits.textContent = "00:00";
  setTimeout(() => {
    panel.classList.add("hidden");
  }, 2500);
}
