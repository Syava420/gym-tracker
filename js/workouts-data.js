// База шаблонов тренировок и расширенная библиотека 100+ популярных упражнений

// Библиотека самых популярных упражнений в тренажерном зале
window.EXERCISE_CATALOG = [
  // ==================== ГРУДЬ ====================
  { id: "bp_flat", name: "Жим штанги лежа на горизонтальной скамье", category: "Грудь", equip: "Штанга", defaultWeight: 50, targetReps: "6-8", restSeconds: 180, tip: "Лопатки сведены, ноги в пол, опускание к низу груди" },
  { id: "bp_incline_bb", name: "Жим штанги на наклонной скамье (30°)", category: "Грудь", equip: "Штанга", defaultWeight: 40, targetReps: "8-10", restSeconds: 150, tip: "Акцент на верх грудных, локти 45° к корпусу" },
  { id: "bp_decline_bb", name: "Жим штанги головой вниз", category: "Грудь", equip: "Штанга", defaultWeight: 45, targetReps: "8-10", restSeconds: 120, tip: "Акцент на низ грудных мышц" },
  { id: "db_flat_press", name: "Жим гантелей лежа на горизонтальной", category: "Грудь", equip: "Гантели", defaultWeight: 16, targetReps: "8-10", restSeconds: 120, tip: "Глубокая растяжка внизу, сведение вверху" },
  { id: "incline_db_press", name: "Жим гантелей на наклонной 30°", category: "Грудь", equip: "Гантели", defaultWeight: 14, targetReps: "8-10", restSeconds: 120, tip: "Локти 45° к корпусу, пауза 1 сек внизу" },
  { id: "smith_incline_press", name: "Жим в тренажере Смита на наклонной", category: "Грудь", equip: "Тренажер", defaultWeight: 35, targetReps: "10-12", restSeconds: 120, tip: "Безопасная изоляция верха груди" },
  { id: "hammer_chest_press", name: "Жим в тренажере Хаммер (Hammer)", category: "Грудь", equip: "Тренажер", defaultWeight: 40, targetReps: "10-12", restSeconds: 120, tip: "Контроль в негативной фазе" },
  { id: "dips_chest", name: "Отжимания на брусьях (на грудь)", category: "Грудь", equip: "Свой вес", defaultWeight: 0, targetReps: "8-12", restSeconds: 120, tip: "Наклон корпуса вперед, локти разведены" },
  { id: "pushups_floor", name: "Отжимания от пола классические", category: "Грудь", equip: "Свой вес", defaultWeight: 0, targetReps: "15-20", restSeconds: 90, tip: "Прямая линия тела, касание грудью пола" },
  { id: "db_flyes_flat", name: "Разведение гантелей лежа", category: "Грудь", equip: "Гантели", defaultWeight: 10, targetReps: "12-15", restSeconds: 90, tip: "Мягкие локти, акцент на растяжение" },
  { id: "db_flyes_incline", name: "Разведение гантелей на наклонной", category: "Грудь", equip: "Гантели", defaultWeight: 8, targetReps: "12-15", restSeconds: 90, tip: "Растяжка верха груди без переразгибания плеч" },
  { id: "pec_deck", name: "Сведение рук в тренажере Бабочка (Пек-дек)", category: "Грудь", equip: "Тренажер", defaultWeight: 35, targetReps: "12-15", restSeconds: 90, tip: "Пиковое сокращение на 1 секунду" },
  { id: "crossover_high", name: "Сведение рук в кроссовере с верхних блоков", category: "Грудь", equip: "Блок", defaultWeight: 15, targetReps: "12-15", restSeconds: 90, tip: "Тяга вперед и вниз, акцент на низ груди" },
  { id: "crossover_low", name: "Сведение рук в кроссовере с нижних блоков", category: "Грудь", equip: "Блок", defaultWeight: 10, targetReps: "12-15", restSeconds: 90, tip: "Подъем снизу вверх, акцент на верх груди" },
  { id: "pullover_db", name: "Пуловер с гантелью лежа на скамье", category: "Грудь", equip: "Гантели", defaultWeight: 16, targetReps: "10-12", restSeconds: 90, tip: "Раскрытие грудной клетки и широчайших" },

  // ==================== СПИНА ====================
  { id: "pullups", name: "Подтягивания на турнике широким хватом", category: "Спина", equip: "Свой вес", defaultWeight: 0, targetReps: "6-8", restSeconds: 150, tip: "Тяга грудью к перекладине, без рывков" },
  { id: "pullups_neutral", name: "Подтягивания параллельным хватом", category: "Спина", equip: "Свой вес", defaultWeight: 0, targetReps: "6-8", restSeconds: 150, tip: "Мягче для локтей, мощный упор на широчайшие" },
  { id: "pullups_chin", name: "Подтягивания обратным хватом", category: "Спина", equip: "Свой вес", defaultWeight: 0, targetReps: "6-8", restSeconds: 150, tip: "Подключение бицепса и низа широчайших" },
  { id: "gravitron_pullups", name: "Подтягивания в гравитроне с противовесом", category: "Спина", equip: "Тренажер", defaultWeight: 20, targetReps: "8-10", restSeconds: 120, tip: "Идеально для отработки чистой техники" },
  { id: "deadlift_classic", name: "Становая тяга классическая со штангой", category: "Спина", equip: "Штанга", defaultWeight: 70, targetReps: "5-6", restSeconds: 180, tip: "Прямая спина, срыв ногами, гриф у голени" },
  { id: "barbell_row", name: "Тяга штанги в наклоне к поясу", category: "Спина", equip: "Штанга", defaultWeight: 50, targetReps: "8-10", restSeconds: 120, tip: "Угол 45-70°, тяга локтями к тазу" },
  { id: "barbell_row_underhand", name: "Тяга штанги обратным хватом (хват Ятса)", category: "Спина", equip: "Штанга", defaultWeight: 45, targetReps: "8-10", restSeconds: 120, tip: "Акцент на низ и толщину широчайших" },
  { id: "one_arm_db_row", name: "Тяга гантели в наклоне с упором о скамью", category: "Спина", equip: "Гантели", defaultWeight: 16, targetReps: "8-10", restSeconds: 120, tip: "Тяга локтем к карману, без разворота корпуса" },
  { id: "t_bar_row", name: "Тяга Т-грифа с упором в грудь", category: "Спина", equip: "Тренажер", defaultWeight: 35, targetReps: "10-12", restSeconds: 120, tip: "Снята нагрузка с поясницы, чистая спина" },
  { id: "lat_pulldown", name: "Тяга верхнего блока к груди широким хватом", category: "Спина", equip: "Блок", defaultWeight: 35, targetReps: "10-12", restSeconds: 120, tip: "Локти строго вниз к карманам, сведение лопаток" },
  { id: "lat_pulldown_close", name: "Тяга верхнего блока узким параллельным хватом", category: "Спина", equip: "Блок", defaultWeight: 40, targetReps: "10-12", restSeconds: 120, tip: "Глубокая амплитуда и растяжение вверху" },
  { id: "cable_row", name: "Тяга горизонтального блока к поясу сидя", category: "Спина", equip: "Блок", defaultWeight: 40, targetReps: "10-12", restSeconds: 120, tip: "Грудь вперед навстречу рукояти, спина прямая" },
  { id: "hammer_row", name: "Тяга в рычажном тренажере Хаммер на спину", category: "Спина", equip: "Тренажер", defaultWeight: 35, targetReps: "10-12", restSeconds: 120, tip: "Поочередно каждой рукой или двумя сразу" },
  { id: "straight_arm_pulldown", name: "Пулловер на блоке прямыми руками с канатом", category: "Спина", equip: "Блок", defaultWeight: 20, targetReps: "12-15", restSeconds: 90, tip: "Изоляция широчайших мышц без сгибания рук" },
  { id: "hyperextension", name: "Гиперэкстензия для разгибателей спины", category: "Спина", equip: "Свой вес", defaultWeight: 0, targetReps: "12-15", restSeconds: 90, tip: "Плавный подъем до ровной линии, без перегиба" },
  { id: "shrugs_bb", name: "Шраги со штангой стоя на трапеции", category: "Спина", equip: "Штанга", defaultWeight: 60, targetReps: "12-15", restSeconds: 90, tip: "Движение строго вверх-вниз, без вращения плеч" },
  { id: "shrugs_db", name: "Шраги с гантелями стоя", category: "Спина", equip: "Гантели", defaultWeight: 20, targetReps: "12-15", restSeconds: 90, tip: "Пиковая фиксация вверху на 1 секунду" },

  // ==================== НОГИ ====================
  { id: "barbell_squat", name: "Приседания со штангой на спине", category: "Ноги", equip: "Штанга", defaultWeight: 60, targetReps: "6-8", restSeconds: 180, tip: "Колени сонаправлены стопам, пятки в пол" },
  { id: "front_squat", name: "Фронтальные приседания (штанга на груди)", category: "Ноги", equip: "Штанга", defaultWeight: 45, targetReps: "6-8", restSeconds: 150, tip: "Строго вертикальный корпус, квадрицепс" },
  { id: "smith_squat", name: "Приседания в тренажере Смита", category: "Ноги", equip: "Тренажер", defaultWeight: 50, targetReps: "8-10", restSeconds: 150, tip: "Вынос стоп чуть вперед для разгрузки коленей" },
  { id: "hack_squat", name: "Гакк-присед в тренажере", category: "Ноги", equip: "Тренажер", defaultWeight: 30, targetReps: "8-10", restSeconds: 150, tip: "Спина плотно прижата к спинке, глубокий сед" },
  { id: "leg_press", name: "Жим ногами в тренажере (45°)", category: "Ноги", equip: "Тренажер", defaultWeight: 100, targetReps: "10-12", restSeconds: 120, tip: "Таз вжат в кресло, колени не щелкать вверху" },
  { id: "single_leg_press", name: "Жим одной ногой в тренажере", category: "Ноги", equip: "Тренажер", defaultWeight: 40, targetReps: "10-12", restSeconds: 90, tip: "Устраняет асимметрию между ногами" },
  { id: "rdl", name: "Румынская становая тяга со штангой", category: "Ноги", equip: "Штанга", defaultWeight: 60, targetReps: "8-10", restSeconds: 120, tip: "Отвод таза назад, гриф у ног, используй лямки" },
  { id: "rdl_db", name: "Румынская тяга с гантелями", category: "Ноги", equip: "Гантели", defaultWeight: 18, targetReps: "10-12", restSeconds: 120, tip: "Акцент на растяжение бицепса бедра и ягодиц" },
  { id: "lunges_db", name: "Выпады с гантелями шагами / на месте", category: "Ноги", equip: "Гантели", defaultWeight: 10, targetReps: "10-12 на ногу", restSeconds: 120, tip: "Угол 90° в коленях, колено не заваливать внутрь" },
  { id: "bulgarian_split_squat", name: "Болгарские сплит-приседания с гантелями", category: "Ноги", equip: "Гантели", defaultWeight: 10, targetReps: "8-10 на ногу", restSeconds: 120, tip: "Задняя нога на скамье, мощный упор в ягодицу" },
  { id: "leg_extension", name: "Разгибания ног в тренажере сидя", category: "Ноги", equip: "Тренажер", defaultWeight: 25, targetReps: "12-15", restSeconds: 90, tip: "Пауза 1 секунда в точке сжатия квадрицепсов" },
  { id: "leg_curls_lying", name: "Сгибания ног в тренажере лежа", category: "Ноги", equip: "Тренажер", defaultWeight: 25, targetReps: "12-15", restSeconds: 90, tip: "Таз прижат, мощное сгибание к ягодицам" },
  { id: "leg_curls_seated", name: "Сгибания ног в тренажере сидя", category: "Ноги", equip: "Тренажер", defaultWeight: 30, targetReps: "10-12", restSeconds: 90, tip: "Глубокая изоляция бицепса бедра" },
  { id: "hip_thrust", name: "Ягодичный мостик со штангой", category: "Ноги", equip: "Штанга", defaultWeight: 50, targetReps: "10-12", restSeconds: 120, tip: "Пауза 2 сек вверху, упор лопатками в скамью" },
  { id: "hip_abduction", name: "Разведение ног в тренажере (ягодичные)", category: "Ноги", equip: "Тренажер", defaultWeight: 35, targetReps: "15-20", restSeconds: 60, tip: "Наклон корпуса вперед для лучшего сокращения" },
  { id: "hip_adduction", name: "Сведение ног в тренажере (приводящие)", category: "Ноги", equip: "Тренажер", defaultWeight: 30, targetReps: "15-20", restSeconds: 60, tip: "Плавное движение без удара весов" },
  { id: "calf_standing", name: "Подъем на носки стоя в тренажере (икры)", category: "Ноги", equip: "Тренажер", defaultWeight: 45, targetReps: "12-15", restSeconds: 60, tip: "Пауза 2 сек внизу в растяжке и 1 сек вверху" },
  { id: "calf_seated", name: "Подъем на носки сидя (камбаловидная мышца)", category: "Ноги", equip: "Тренажер", defaultWeight: 30, targetReps: "15-20", restSeconds: 60, tip: "Дает толщину голени сбоку" },

  // ==================== ПЛЕЧИ (ДЕЛЬТЫ) ====================
  { id: "overhead_press_bb", name: "Армейский жим штанги стоя (OHP)", category: "Плечи", equip: "Штанга", defaultWeight: 35, targetReps: "6-8", restSeconds: 150, tip: "Пресс зажат, ягодицы напряжены, голова не запрокинута" },
  { id: "seated_bb_press", name: "Жим штанги сидя с груди", category: "Плечи", equip: "Штанга", defaultWeight: 35, targetReps: "8-10", restSeconds: 120, tip: "Спинка скамьи 75-80 градусов" },
  { id: "seated_db_press", name: "Жим гантелей сидя на скамье", category: "Плечи", equip: "Гантели", defaultWeight: 14, targetReps: "8-10", restSeconds: 120, tip: "Опускание до уровня ушей, локти под углом" },
  { id: "arnold_press", name: "Жим Арнольда с гантелями", category: "Плечи", equip: "Гантели", defaultWeight: 12, targetReps: "10-12", restSeconds: 90, tip: "Разворот кистей при подъеме вверх" },
  { id: "machine_shoulder_press", name: "Жим в тренажере на плечи", category: "Плечи", equip: "Тренажер", defaultWeight: 35, targetReps: "10-12", restSeconds: 90, tip: "Безопасная работа без стабилизаторов" },
  { id: "lateral_raises", name: "Махи гантелями через стороны стоя", category: "Плечи", equip: "Гантели", defaultWeight: 7, targetReps: "12-15", restSeconds: 90, tip: "Без читинга, мизинец чуть выше большого пальца" },
  { id: "seated_lateral_raises", name: "Махи гантелями через стороны сидя", category: "Плечи", equip: "Гантели", defaultWeight: 6, targetReps: "12-15", restSeconds: 90, tip: "Исключает рывок ногами и корпусом" },
  { id: "cable_lateral_raise", name: "Махи на нижнем блоке одной рукой", category: "Плечи", equip: "Блок", defaultWeight: 5, targetReps: "12-15", restSeconds: 90, tip: "Постоянное натяжение во всей амплитуде" },
  { id: "front_raises_db", name: "Подъем гантелей перед собой", category: "Плечи", equip: "Гантели", defaultWeight: 8, targetReps: "12-15", restSeconds: 90, tip: "Акцент на переднюю дельту" },
  { id: "rear_delt_db_flyes", name: "Махи гантелями в наклоне (задняя дельта)", category: "Плечи", equip: "Гантели", defaultWeight: 6, targetReps: "12-15", restSeconds: 90, tip: "Локти в стороны, не сводить лопатки" },
  { id: "face_pull", name: "Face Pull (тяга каната к лицу на блоке)", category: "Плечи", equip: "Блок", defaultWeight: 18, targetReps: "12-15", restSeconds: 90, tip: "Локти высоко, разворот кистей наружу за уши" },
  { id: "reverse_pec_deck", name: "Разведение рук в Пек-дек (задняя дельта)", category: "Плечи", equip: "Тренажер", defaultWeight: 25, targetReps: "12-15", restSeconds: 90, tip: "Локти чуть согнуты, движение назад" },
  { id: "upright_row_bb", name: "Тяга штанги к подбородку (протяжка)", category: "Плечи", equip: "Штанга", defaultWeight: 25, targetReps: "10-12", restSeconds: 90, tip: "Широкий хват для акцента на среднюю дельту" },

  // ==================== РУКИ (БИЦЕПС / ТРИЦЕПС) ====================
  { id: "bb_biceps_curl", name: "Подъем прямой штанги на бицепс стоя", category: "Руки", equip: "Штанга", defaultWeight: 25, targetReps: "8-10", restSeconds: 90, tip: "Локти прижаты, без отклонения назад" },
  { id: "ez_biceps_curl", name: "Подъем EZ-грифа на бицепс стоя", category: "Руки", equip: "Штанга", defaultWeight: 20, targetReps: "10-12", restSeconds: 90, tip: "Комфортный угол для запястий" },
  { id: "db_curls_supination", name: "Сгибания на бицепс с гантелями с супинацией", category: "Руки", equip: "Гантели", defaultWeight: 10, targetReps: "10-12", restSeconds: 90, tip: "Разворот мизинца наружу в верхней точке" },
  { id: "hammer_curls", name: "Молотки с гантелями (Hammer Curls)", category: "Руки", equip: "Гантели", defaultWeight: 8, targetReps: "10-12", restSeconds: 90, tip: "Нейтральный хват, акцент на брахиалис" },
  { id: "incline_db_curls", name: "Сгибания на бицепс на наклонной скамье", category: "Руки", equip: "Гантели", defaultWeight: 8, targetReps: "10-12", restSeconds: 90, tip: "Мощная растяжка длинной головки бицепса" },
  { id: "scott_bench_curls", name: "Сгибания на скамье Скотта с EZ-грифом", category: "Руки", equip: "Штанга", defaultWeight: 18, targetReps: "10-12", restSeconds: 90, tip: "Полная изоляция, руки не отрывать от подушки" },
  { id: "cable_biceps_curl", name: "Сгибания на бицепс на нижнем блоке", category: "Руки", equip: "Блок", defaultWeight: 20, targetReps: "12-15", restSeconds: 90, tip: "Непрерывное напряжение в верхней точке" },
  { id: "french_press_ez", name: "Французский жим с EZ-грифом лежа", category: "Руки", equip: "Штанга", defaultWeight: 20, targetReps: "10-12", restSeconds: 90, tip: "Опускание грифа ко лбу/темени, локти на месте" },
  { id: "close_grip_bench_press", name: "Жим штанги узким хватом лежа", category: "Руки", equip: "Штанга", defaultWeight: 45, targetReps: "8-10", restSeconds: 120, tip: "Хват на ширине плеч, локти идут вдоль ребер" },
  { id: "triceps_pushdown_rope", name: "Разгибания на верхнем блоке с канатом", category: "Руки", equip: "Блок", defaultWeight: 20, targetReps: "12-15", restSeconds: 90, tip: "Разведение каната в стороны внизу" },
  { id: "triceps_pushdown_bar", name: "Разгибания на верхнем блоке с прямой ручкой", category: "Руки", equip: "Блок", defaultWeight: 25, targetReps: "10-12", restSeconds: 90, tip: "Локти зафиксированы у корпуса" },
  { id: "overhead_triceps_db", name: "Французский жим с гантелью из-за головы", category: "Руки", equip: "Гантели", defaultWeight: 16, targetReps: "10-12", restSeconds: 90, tip: "Растяжение длинной головки трицепса" },
  { id: "overhead_cable_extension", name: "Разгибания из-за головы на блоке (канат)", category: "Руки", equip: "Блок", defaultWeight: 18, targetReps: "12-15", restSeconds: 90, tip: "Шаг вперед, корпус чуть наклонен" },
  { id: "dips_triceps", name: "Отжимания на брусьях (акцент на трицепс)", category: "Руки", equip: "Свой вес", defaultWeight: 0, targetReps: "8-10", restSeconds: 120, tip: "Вертикальный корпус, локти прижаты к телу" },
  { id: "bench_dips", name: "Обратные отжимания от скамьи", category: "Руки", equip: "Свой вес", defaultWeight: 0, targetReps: "12-15", restSeconds: 90, tip: "Ноги на полу или на второй скамье" },
  { id: "wrist_curls_bb", name: "Сгибания кистей со штангой (предплечья)", category: "Руки", equip: "Штанга", defaultWeight: 20, targetReps: "15-20", restSeconds: 60, tip: "Тренировка мышц предплечья и силы хвата" },

  // ==================== ПРЕСС И КОР ====================
  { id: "cable_crunch", name: "Скручивания на верхнем блоке (Молитва)", category: "Пресс", equip: "Блок", defaultWeight: 25, targetReps: "10-12", restSeconds: 90, tip: "Таз над пятками, скручивай ребра к тазу" },
  { id: "hanging_leg_raise", name: "Подъем прямых ног в висе на турнике", category: "Пресс", equip: "Свой вес", defaultWeight: 0, targetReps: "10-12", restSeconds: 90, tip: "Подкручивай таз вверх, а не просто поднимай ноги" },
  { id: "captain_chair_leg_raise", name: "Подъем коленей в упоре на брусьях", category: "Пресс", equip: "Свой вес", defaultWeight: 0, targetReps: "12-15", restSeconds: 60, tip: "Контролируемый подъем без раскачки" },
  { id: "floor_crunches", name: "Классические скручивания на коврике", category: "Пресс", equip: "Свой вес", defaultWeight: 0, targetReps: "20-25", restSeconds: 60, tip: "Поясница прижата к полу, лопатки отрываются" },
  { id: "decline_bench_crunches", name: "Скручивания на наклонной скамье", category: "Пресс", equip: "Свой вес", defaultWeight: 0, targetReps: "15-20", restSeconds: 60, tip: "Руки у висков, скручивание без рывка шеей" },
  { id: "plank", name: "Классическая планка на локтях", category: "Пресс", equip: "Свой вес", defaultWeight: 0, targetReps: "45-60 сек", restSeconds: 60, tip: "Пресс и ягодицы зажаты, поясница не провисает" },
  { id: "ab_wheel", name: "Прокатка с гимнастическим роликом", category: "Пресс", equip: "Свой вес", defaultWeight: 0, targetReps: "8-12", restSeconds: 90, tip: "Округлая спина, мощная нагрузка на весь кор" },
  { id: "hang_decompression", name: "Вис на турнике (Декомпрессия и хват)", category: "Пресс", equip: "Свой вес", defaultWeight: 0, targetReps: "35-45 сек", restSeconds: 60, tip: "Полное расслабление спины, растяжение позвоночника" },

  // ==================== БЕГ И КАРДИО ====================
  { id: "run_easy", name: "Кросс на объем (легкий бег)", category: "Бег", equip: "Дорожка / Улица", defaultDistance: 3.0, defaultPace: "6:00-6:20", targetReps: "3.0 км", restSeconds: 0, isCardio: true, tip: "Дыхание ровное, темп разговорный, пульс до 145 уд/мин" },
  { id: "run_warmup", name: "Разминка: Легкий бег", category: "Бег", equip: "Дорожка", defaultDistance: 1.0, defaultPace: "6:30", targetReps: "1.0 км", restSeconds: 120, isCardio: true, tip: "Плавное вкатывание, разогрев мышц и связок" },
  { id: "run_intervals_400", name: "Интервал 400 метров (14 км/ч)", category: "Бег", equip: "Дорожка / Манеж", defaultDistance: 0.4, defaultPace: "4:20 (01:44)", targetReps: "400 м", restSeconds: 120, isCardio: true, tip: "Скорость 14.0 км/ч, темп ~4:20 (01:44 на круг). Отдых 2 мин шагом или трусцой" },
  { id: "run_intervals_800", name: "Интервал 800 метров (14.2 км/ч)", category: "Бег", equip: "Дорожка / Манеж", defaultDistance: 0.8, defaultPace: "4:15 (03:24)", targetReps: "800 м", restSeconds: 180, isCardio: true, tip: "Скорость 14.2 км/ч, темп 4:15 (03:24 на отрезок). Отдых 3 мин шагом" },
  { id: "run_intervals_1000", name: "Интервал 1000 метров (1 км)", category: "Бег", equip: "Дорожка", defaultDistance: 1.0, defaultPace: "4:15-4:20", targetReps: "1.0 км", restSeconds: 180, isCardio: true, tip: "Отработка соревновательного крейсерского темпа" },
  { id: "run_pace_400", name: "Скоростной интервал 400м (15 км/ч)", category: "Бег", equip: "Дорожка", defaultDistance: 0.4, defaultPace: "4:00 (01:36)", targetReps: "400 м", restSeconds: 150, isCardio: true, tip: "Скорость 15.0 км/ч, темп 4:00 (01:36). Отдых 2.5 мин" },
  { id: "run_test_2km", name: "Контрольный тест 2 км (Цель: 8:30-8:40)", category: "Бег", equip: "Дорожка", defaultDistance: 2.0, defaultPace: "4:15-4:20", targetReps: "2.0 км", restSeconds: 0, isCardio: true, tip: "Тест готовности к 3 км. Удержать темп 4:15-4:20" },
  { id: "run_test_3km", name: "Контрольный забег 3 км", category: "Бег", equip: "Дорожка / Улица", defaultDistance: 3.0, defaultPace: "4:20", targetReps: "3.0 км", restSeconds: 0, isCardio: true, tip: "Итоговый норматив на 3 км! Ровный темп по километрам" },
  { id: "run_cooldown", name: "Заминка: Шаг и восстановление", category: "Бег", equip: "Дорожка", defaultDistance: 0.5, defaultPace: "шаг", targetReps: "500 м", restSeconds: 0, isCardio: true, tip: "Скорость 5-6 км/ч, глубокое восстановление дыхания" },
  { id: "run_fartlek", name: "Фартлек (рваный темп: 1 мин быстро / 1 мин легко)", category: "Бег", equip: "Дорожка / Улица", defaultDistance: 3.0, defaultPace: "05:15", targetReps: "3.0 км", restSeconds: 0, isCardio: true, tip: "Чередование: 1 мин быстро (14 км/ч) / 1 мин трусца (8 км/ч)" },
  { id: "run_incline_hill", name: "Бег в гору на дорожке (наклон 3-5%)", category: "Бег", equip: "Дорожка", defaultDistance: 2.0, defaultPace: "05:45", targetReps: "2.0 км", restSeconds: 90, isCardio: true, tip: "Угол наклона 3-5%, мощный толчок стопой" },
  { id: "run_incline_walk", name: "Ходьба в гору на дорожке (наклон 10-12%)", category: "Бег", equip: "Дорожка", defaultDistance: 2.5, defaultPace: "10:00", targetReps: "2.5 км", restSeconds: 0, isCardio: true, tip: "Скорость 5.5-6.0 км/ч, наклон 10-12%. Отличное жиросжигание!" },
  { id: "run_tempo_pano", name: "Темповый бег (на уровне ПАНО)", category: "Бег", equip: "Дорожка / Манеж", defaultDistance: 4.0, defaultPace: "04:45", targetReps: "4.0 км", restSeconds: 0, isCardio: true, tip: "Крейсерский жесткий темп, ровное дыхание" },
  { id: "run_progressive", name: "Прогрессивный кросс (с ускорением)", category: "Бег", equip: "Дорожка", defaultDistance: 4.0, defaultPace: "05:20", targetReps: "4.0 км", restSeconds: 0, isCardio: true, tip: "Каждый километр на 10-15 секунд быстрее предыдущего" },
  { id: "run_sprint_60", name: "Спринт 60 метров (максимальное ускорение)", category: "Бег", equip: "Дорожка / Манеж", defaultDistance: 0.06, defaultPace: "03:15", targetReps: "60 м", restSeconds: 90, isCardio: true, tip: "100% взрывная скорость от старта до финиша" },
  { id: "run_recovery", name: "Восстановительный бег трусцой (пульс 120-130)", category: "Бег", equip: "Дорожка / Улица", defaultDistance: 2.5, defaultPace: "06:45", targetReps: "2.5 км", restSeconds: 0, isCardio: true, tip: "Мягкий восстановительный бег для разгрузки ног" },

  // ==================== ЭЛЛИПС И КАРДИО-ТРЕНАЖЕРЫ ====================
  { id: "el_warmup", name: "Эллипс: Разминка перед силовой", category: "Эллипс", equip: "Эллипс", defaultDistance: 1.0, defaultPace: "06:30", targetReps: "1.0 км", restSeconds: 60, isCardio: true, tip: "Легкое сопротивление (уровень 3-5), разогрев коленей и плечевого пояса" },
  { id: "el_burn", name: "Эллипс: Жиросжигающее кардио", category: "Эллипс", equip: "Эллипс", defaultDistance: 3.5, defaultPace: "06:00", targetReps: "3.5 км", restSeconds: 0, isCardio: true, tip: "Умеренный пульс 125-140 уд/мин, среднее сопротивление (уровень 6-8)" },
  { id: "el_hiit", name: "Эллипс: Интервалы высокой мощности (HIIT)", category: "Эллипс", equip: "Эллипс", defaultDistance: 0.5, defaultPace: "04:30", targetReps: "500 м", restSeconds: 90, isCardio: true, tip: "30-45 сек мощное ускорение на тяжелом сопротивлении, 1 мин отдых" },
  { id: "el_incline", name: "Эллипс: Длинная дистанция на выносливость", category: "Эллипс", equip: "Эллипс", defaultDistance: 5.0, defaultPace: "05:45", targetReps: "5.0 км", restSeconds: 0, isCardio: true, tip: "Стабильный каденс без остановок, глубокое дыхание" },
  { id: "el_cooldown", name: "Эллипс: Заминка и пульсовое восстановление", category: "Эллипс", equip: "Эллипс", defaultDistance: 0.8, defaultPace: "08:00", targetReps: "800 м", restSeconds: 0, isCardio: true, tip: "Минимальная нагрузка, глубокий вдох-выдох" },
  // ==================== ВЕЛОТРЕНАЖЕР ====================
  { id: "bike_warmup", name: "Вело: Разминка перед силовой", category: "Вело", equip: "Велотренажер", defaultDistance: 2.0, defaultPace: "03:00", targetReps: "2.0 км", restSeconds: 60, isCardio: true, cardioType: "bike", tip: "Легкая нагрузка (Level 3-5), каденс 80-90 об/мин" },
  { id: "bike_steady", name: "Вело: Ровный темп на выносливость", category: "Вело", equip: "Велотренажер", defaultDistance: 5.0, defaultPace: "02:30", targetReps: "5.0 км", restSeconds: 0, isCardio: true, cardioType: "bike", tip: "Умеренный пульс 120-135 уд/мин, средняя нагрузка (Level 6-8)" },
  { id: "bike_intervals", name: "Вело: Спринтерские интервалы HIIT", category: "Вело", equip: "Велотренажер", defaultDistance: 1.0, defaultPace: "01:45", targetReps: "1.0 км", restSeconds: 90, isCardio: true, cardioType: "bike", tip: "30 сек спринт на высокой нагрузке (Level 10-14), 1 мин отдых" },
  { id: "bike_hills", name: "Вело: Подъем в гору (силовое кардио)", category: "Вело", equip: "Велотренажер", defaultDistance: 3.0, defaultPace: "03:30", targetReps: "3.0 км", restSeconds: 60, isCardio: true, cardioType: "bike", tip: "Высокое сопротивление (Level 10-15), работа сидя и стоя" },
  { id: "bike_cooldown", name: "Вело: Заминка и восстановление", category: "Вело", equip: "Велотренажер", defaultDistance: 1.0, defaultPace: "04:00", targetReps: "1.0 км", restSeconds: 0, isCardio: true, cardioType: "bike", tip: "Минимальное сопротивление (Level 1-2), спокойное дыхание" },
  // ==================== ГРЕБЛЯ И СТЕППЕР ====================
  { id: "rower_steady", name: "Гребной тренажер: 2000 м", category: "Кардио", equip: "Гребной тренажер", defaultDistance: 2.0, defaultPace: "08:00", targetReps: "2.0 км", restSeconds: 90, isCardio: true, cardioType: "rower", tip: "Мощный толчок ногами, затем наклон корпуса и тяга к низу ребер" },
  { id: "stepper_cardio", name: "Степпер / Лестница (StairMaster)", category: "Кардио", equip: "Степпер", defaultDistance: 1.5, defaultPace: "10:00", targetReps: "1.5 км", restSeconds: 60, isCardio: true, cardioType: "stepper", tip: "Прямой корпус, не виснуть на поручнях, упор всей стопой" }
];

// Категории для фильтрации "по папкам"
window.EXERCISE_CATEGORIES = ["Все", "Грудь", "Спина", "Ноги", "Плечи", "Руки", "Пресс", "Бег", "Эллипс", "Вело", "Кардио"];

// Шаблоны тренировок: пустой список для чистого старта с нуля
window.DEFAULT_WORKOUTS = [];
