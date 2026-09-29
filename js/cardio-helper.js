// cardio-helper.js
// Модуль работы с кардио-упражнениями (бег, велотренажер, эллипс, гребля, степпер, улица)
// Поддерживает:
// 1. Оборудование и параметры тренажеров (Уклон %, Нагрузка Lvl, Тяжесть Lvl)
// 2. Интерактивное циклическое переключение единиц по клику в шапке таблицы:
//    - Дистанция: [ км ⇄ м ]
//    - Время: [ мин ⇄ сек ⇄ час ]
// 3. Режимы «По дистанции» и «По времени»
// 4. Секундомер / таймер отрезка «Нажал и побежал» (сворачивание, работа в фоне)

function isCardioExercise(ex) {
  if (!ex) return false;
  if (ex.isCardio === false) return false;
  if (ex.category === "Силовые") return false;
  if (ex.isCardio === true) return true;
  if (ex.category === "Бег" || ex.category === "Эллипс" || ex.category === "Вело" || ex.category === "Кардио") return true;
  if (["treadmill", "bike", "ellipse", "rower", "stepper", "outdoor"].includes(ex.cardioType)) return true;
  const name = (ex.name || "").toLowerCase();
  return Boolean(
    name.includes("бег") ||
    name.includes("дорожк") ||
    name.includes("эллипс") ||
    name.includes("вело") ||
    name.includes("байк") ||
    name.includes("гребл") ||
    name.includes("степпер") ||
    name.includes("интервал") ||
    name.includes("спринт") ||
    name.includes("кросс")
  );
}

function getCardioType(ex) {
  if (!ex) return "treadmill";
  if (ex.cardioType && ["treadmill", "bike", "ellipse", "rower", "stepper", "outdoor"].includes(ex.cardioType)) {
    return ex.cardioType;
  }
  const name = (ex.name || "").toLowerCase();
  const cat = (ex.category || "").toLowerCase();
  const equip = (ex.equip || "").toLowerCase();
  if (cat.includes("вело") || name.includes("вело") || equip.includes("вело") || equip.includes("bike")) {
    return "bike";
  }
  if (cat.includes("эллипс") || name.includes("эллипс") || equip.includes("эллипс")) {
    return "ellipse";
  }
  if (name.includes("гребл") || equip.includes("гребл")) {
    return "rower";
  }
  if (name.includes("степпер") || equip.includes("степпер") || name.includes("лестниц")) {
    return "stepper";
  }
  if (equip.includes("улиц") || equip.includes("манеж") || name.includes("улиц")) {
    return "outdoor";
  }
  return "treadmill";
}

function getCardioParamMeta(ex) {
  const type = getCardioType(ex);
  switch (type) {
    case "bike":
      return {
        type: "bike",
        name: "Нагрузка",
        shortName: "НАГРУЗКА",
        unit: "lvl",
        prop: "bikeLevel",
        min: 1,
        max: 25,
        step: 1,
        defaultVal: 5
      };
    case "ellipse":
      return {
        type: "ellipse",
        name: "Тяжесть",
        shortName: "ТЯЖЕСТЬ",
        unit: "lvl",
        prop: "resistanceLevel",
        min: 1,
        max: 25,
        step: 1,
        defaultVal: 5
      };
    case "rower":
      return {
        type: "rower",
        name: "Тяжесть",
        shortName: "ТЯЖЕСТЬ",
        unit: "lvl",
        prop: "rowerLevel",
        min: 1,
        max: 10,
        step: 1,
        defaultVal: 5
      };
    case "stepper":
      return {
        type: "stepper",
        name: "Уровень",
        shortName: "УРОВЕНЬ",
        unit: "lvl",
        prop: "stepperLevel",
        min: 1,
        max: 20,
        step: 1,
        defaultVal: 5
      };
    case "outdoor":
      return {
        type: "outdoor",
        name: "Уклон",
        shortName: "УКЛОН",
        unit: "%",
        prop: "incline",
        min: 0,
        max: 0,
        step: 0,
        defaultVal: 0
      };
    case "treadmill":
    default:
      return {
        type: "treadmill",
        name: "Уклон",
        shortName: "УКЛОН",
        unit: "%",
        prop: "incline",
        min: 0,
        max: 20,
        step: 0.5,
        defaultVal: 1
      };
  }
}

function getDistUnit(ex) {
  if (ex.distUnit) return ex.distUnit;
  if (ex.targetReps && ex.targetReps.includes("м") && !ex.targetReps.includes("км")) {
    return "m";
  }
  return "km";
}

function getTimeUnit(ex) {
  if (ex.timeUnit) return ex.timeUnit;
  if (ex.targetReps && (ex.targetReps.includes("сек") || ex.targetReps.includes("с"))) {
    return "sec";
  }
  if (ex.targetReps && (ex.targetReps.includes("час") || ex.targetReps.includes("ч"))) {
    return "hour";
  }
  return "min";
}

/**
 * Переключение единиц дистанции по клику в шапке: км ⇄ м
 */
function cycleDistanceUnit(ex) {
  const current = getDistUnit(ex);
  const next = current === "km" ? "m" : "km";
  ex.distUnit = next;

  (ex.sets || []).forEach((s) => {
    let d = parseFloat(s.distance);
    if (isNaN(d)) d = ex.defaultDistance || (next === "m" ? 400 : 0.4);
    if (next === "m") {
      s.distance = Math.round(d * 1000);
    } else {
      s.distance = Math.round((d / 1000) * 100) / 100;
    }
  });

  if (ex.defaultDistance) {
    if (next === "m") {
      ex.defaultDistance = Math.round(ex.defaultDistance * 1000);
    } else {
      ex.defaultDistance = Math.round((ex.defaultDistance / 1000) * 100) / 100;
    }
  }

  return next;
}

/**
 * Циклическое переключение единиц времени по клику в шапке: мин ⇄ сек ⇄ час
 */
function cycleTimeUnit(ex) {
  const current = getTimeUnit(ex);
  let next = "min";
  if (current === "min") next = "sec";
  else if (current === "sec") next = "hour";
  else next = "min";

  ex.timeUnit = next;
  const isTimeMode = ex.cardioMode === "time";

  (ex.sets || []).forEach((s) => {
    // Вычисляем текущее общее количество секунд
    let totalSec = 0;
    if (current === "sec") {
      totalSec = s.seconds || parseInt(s.time, 10) || 60;
    } else if (current === "hour") {
      const h = s.hours || parseFloat(s.time) || 0.5;
      totalSec = Math.round(h * 3600);
    } else {
      // min
      if (s.time && String(s.time).includes(":")) {
        const parts = String(s.time).split(":");
        totalSec = (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
      } else {
        const m = s.minutes || parseInt(s.time, 10) || 20;
        totalSec = m * 60;
      }
    }

    if (totalSec <= 0) totalSec = 1200;

    if (next === "sec") {
      s.seconds = totalSec;
      s.time = isTimeMode ? `${totalSec} сек` : String(totalSec);
    } else if (next === "hour") {
      const h = Math.round((totalSec / 3600) * 100) / 100;
      s.hours = h;
      s.time = isTimeMode ? `${h} ч` : String(h);
    } else {
      // min
      const m = Math.max(1, Math.round(totalSec / 60));
      s.minutes = m;
      if (isTimeMode) {
        s.time = `${m} мин`;
      } else {
        const remSec = totalSec % 60;
        s.time = `${m}:${remSec < 10 ? "0" : ""}${remSec}`;
      }
    }
  });

  return next;
}

function renderCardioSetRow(...args) {
  if (window.CardioRow && window.CardioRow.renderCardioSetRow) {
    return window.CardioRow.renderCardioSetRow(...args);
  }
}

window.CardioHelper = {
  isCardioExercise,
  getCardioType,
  getCardioParamMeta,
  getDistUnit,
  getTimeUnit,
  cycleDistanceUnit,
  cycleTimeUnit,
  renderCardioSetRow
};
