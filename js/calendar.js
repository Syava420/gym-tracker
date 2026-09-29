// Модуль календаря: неделя + полный месячный календарь для журнала тренировок

const DAY_NAMES = ["ВС", "ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ"];
const MONTH_NAMES = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
];

/**
 * Получить список дней текущей недели (с Пн по Вс)
 */
function getCurrentWeekDays() {
  const now = new Date();
  const currentDayOfWeek = now.getDay();
  const distanceToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
  
  const monday = new Date(now);
  monday.setDate(now.getDate() + distanceToMonday);

  const routines = (window.StorageModule && typeof window.StorageModule.getUserRoutines === "function")
    ? window.StorageModule.getUserRoutines()
    : [];

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);

    const dayOfWeek = d.getDay();
    const isToday = d.toDateString() === now.toDateString();
    const dayName = DAY_NAMES[dayOfWeek];

    // Ищем реально существующую программу пользователя для этого дня
    let matchedRoutine = routines.find((r) => {
      const tag = (r.tag || "").toUpperCase().trim();
      return tag === dayName;
    });

    // Если по тегу не найдено, проверяем старый id, ТОЛЬКО если эта программа РЕАЛЬНО есть в списке (не удалена)
    if (!matchedRoutine) {
      let defaultId = null;
      if (dayOfWeek === 1) defaultId = "upper_a";
      else if (dayOfWeek === 2) defaultId = "lower_a";
      else if (dayOfWeek === 4) defaultId = "upper_b";
      else if (dayOfWeek === 5) defaultId = "lower_b";

      if (defaultId) {
        matchedRoutine = routines.find((r) => r.id === defaultId);
      }
    }

    const workoutId = matchedRoutine ? matchedRoutine.id : null;
    const workoutLabel = matchedRoutine ? (matchedRoutine.title || matchedRoutine.tag) : "Отдых";

    days.push({
      dateObj: d,
      dateNum: d.getDate(),
      dayName,
      dayOfWeek,
      isToday,
      workoutId,
      workoutLabel,
      isRest: workoutId === null
    });
  }

  return days;
}

/**
 * Сетка текущего месяца для Журнала в виде календаря
 */
function getMonthGrid(year, month) {
  const today = new Date();
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const totalDays = lastDayOfMonth.getDate();
  // День недели 1-го числа (1=Пн ... 0=Вс -> переводим в 0..6 где 0 это Пн)
  let startOffset = firstDayOfMonth.getDay() - 1;
  if (startOffset === -1) startOffset = 6;

  const cells = [];

  // Пустые ячейки до начала месяца
  for (let i = 0; i < startOffset; i++) {
    cells.push({ isEmpty: true });
  }

  // Дни месяца
  for (let dayNum = 1; dayNum <= totalDays; dayNum++) {
    const d = new Date(year, month, dayNum);
    const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
    const isToday = d.toDateString() === today.toDateString();

    cells.push({
      isEmpty: false,
      dayNum,
      dateKey,
      dateObj: d,
      isToday
    });
  }

  return {
    year,
    month,
    monthName: MONTH_NAMES[month],
    cells
  };
}

window.CalendarModule = {
  getCurrentWeekDays,
  getMonthGrid
};
