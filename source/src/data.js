// Органы управления Panasonic AG-AC160A.
// Раскладка сверена с фотографиями реальной камеры (AG-AC160AEN) и инструкцией.
// ref — где искать в инструкции: Vol.1 (базовая, 42 с.) и Vol.2 (расширенная, 110 с.).
// face/a/b — где элемент стоит на модели (см. FACES в main.js).

export const ZONES = [
  { id: 'lens', name: 'Объектив' },
  { id: 'left', name: 'Левая сторона' },
  { id: 'underlcd', name: 'Панель под ЖК-экраном' },
  { id: 'handle', name: 'Верхняя ручка' },
  { id: 'right', name: 'Правая сторона и рукоятка' },
  { id: 'rear', name: 'Задняя часть' },
  { id: 'bottom', name: 'Перед и низ' },
];

export const CONTROLS = [
  // ───────── ОБЪЕКТИВ ─────────
  {
    id: 'hood', zone: 'lens', label: 'LENS HOOD', ru: 'Бленда',
    desc: 'Широкая прямоугольная бленда закрывает переднюю линзу от боковых засветок, бликов и случайных касаний. Снимается поворотом.',
    ref: 'Vol.1: «Attaching/removing the lens hood»', kind: 'custom', dist: 40,
  },
  {
    id: 'lens', zone: 'lens', label: '22× OPTICAL ZOOM', ru: 'Объектив 22×',
    desc: 'Встроенный объектив f = 3,9–86 мм, светосила 1:1,6–3,2, резьба под фильтр Ø72 мм. В эквиваленте 35 мм это 28–616 мм: широкий угол без насадок и длинный телеконец. Три независимых кольца: фокус, зум и диафрагма.',
    ref: 'Vol.1: «Specifications»', kind: 'custom', dist: 30,
  },
  {
    id: 'focusRing', zone: 'lens', label: 'FOCUS RING', ru: 'Кольцо фокусировки', no: 'Vol.1 с.21 №21',
    desc: 'Широкое рифлёное кольцо у бленды. Отвечает за ручную наводку на резкость, работает при переключателе FOCUS в положении M. Крутится бесконечно, без упоров (сервопривод). Для точной наводки удобно включить FOCUS ASSIST или EVF DTL.',
    ref: 'Vol.2 с.18', kind: 'custom', dist: 28, anim: 'spin',
  },
  {
    id: 'zoomRing', zone: 'lens', label: 'ZOOM RING', ru: 'Кольцо зума', no: 'Vol.1 с.21 №22',
    desc: 'Кольцо со шкалой фокусных расстояний (3.9 – 8 – 14 – 27 – 86 мм). Даёт механический зум при переключателе ZOOM в положении MANU. В положении SERVO зумом управляют рычаги W/T.',
    ref: 'Vol.2 с.17', kind: 'custom', dist: 26, anim: 'spin',
  },
  {
    id: 'zoomPin', zone: 'lens', label: 'ZOOM LEVER', ru: 'Рычажок кольца зума', no: 'Vol.1 с.22 №13',
    desc: 'Штырёк на кольце зума, за него удобно быстро «перебрасывать» зум пальцем. Вкручивается в отверстие на кольце и при желании снимается.',
    ref: 'Vol.1 с.21–22', kind: 'custom', dist: 18,
  },
  {
    id: 'irisRing', zone: 'lens', label: 'IRIS RING', ru: 'Кольцо диафрагмы', no: 'Vol.1 с.21 №23',
    desc: 'Узкое кольцо с мелкой насечкой у самого корпуса, для ручной регулировки диафрагмы (яркости картинки). Работает в режиме ручной диафрагмы, который включается кнопкой IRIS. Значение F видно на экране.',
    ref: 'Vol.2 с.19', kind: 'custom', dist: 22, anim: 'spin',
  },

  // ───────── ЛЕВАЯ СТОРОНА ─────────
  {
    id: 'nd', zone: 'left', label: 'ND FILTER', ru: 'Диск ND-фильтра', no: 'Vol.1 с.21 №11',
    desc: 'Встроенный нейтрально-серый фильтр для яркого света: OFF, 1/4, 1/16, 1/64. Позволяет не зажимать диафрагму на солнце. Если выбран не тот фильтр, камера подсказывает это значком на экране.',
    ref: 'Vol.2 с.20', kind: 'knob', face: 'L', a: -8.3, b: 9.55, r: 0.55,
    positions: ['OFF', '1/4', '1/16', '1/64'], state: 'nd',
  },
  {
    id: 'focusAssist', zone: 'left', label: 'FOCUS ASSIST', ru: 'Кнопка FOCUS ASSIST', no: 'Vol.1 с.21 №12',
    desc: 'Помощь при ручной фокусировке. В зависимости от настройки меню центр кадра увеличивается в 2,25 раза (EXPAND) и/или контуры в фокусе подсвечиваются красным (IN RED).',
    ref: 'Vol.2 с.18–19', kind: 'rbtn', face: 'L', a: -8.3, b: 7.95, w: 0.85,
  },
  {
    id: 'focusSw', zone: 'left', label: 'FOCUS', ru: 'Переключатель FOCUS', no: 'Vol.1 с.21 №13',
    desc: 'Режим фокусировки. A: автофокус. M: ручной фокус кольцом. ∞: подпружиненное положение, временно наводит на бесконечность и после отпускания возвращается в M.',
    ref: 'Vol.2 с.18', kind: 'sw', face: 'L', a: -8.3, b: 6.3,
    positions: ['A', 'M', '∞'], state: 'focus', step: 0.36,
  },
  {
    id: 'pushAuto', zone: 'left', label: 'PUSH AUTO', ru: 'Кнопка PUSH AUTO', no: 'Vol.1 с.21 №14',
    desc: 'В ручном фокусе, пока кнопка нажата, работает автофокус. У AC160A это быстрый Turbo Speed One-Push AF: камера наводится, вы отпускаете кнопку, и фокус остаётся ручным.',
    ref: 'Vol.2 с.18', kind: 'rbtn', face: 'L', a: -8.3, b: 4.85, w: 0.8,
  },
  {
    id: 'zoomSw', zone: 'left', label: 'ZOOM', ru: 'Переключатель ZOOM', no: 'Vol.1 с.21 №15',
    desc: 'SERVO: моторный зум рычагами W/T на рукоятке и ручке. MANU: механический зум кольцом на объективе.',
    ref: 'Vol.2 с.17', kind: 'sw', face: 'L', a: -8.3, b: 3.8, horiz: true, posLabels: 'below',
    positions: ['MANU', 'SERVO'], state: 'zoomMode', step: 0.5, posSize: 0.085,
  },
  {
    id: 'ois', zone: 'left', label: 'OIS', ru: 'Кнопка OIS', no: 'Vol.1 с.21 №8',
    desc: 'Включает или выключает оптический стабилизатор изображения. На штативе его лучше выключить.',
    ref: 'Vol.2 с.27', kind: 'rbtn', face: 'LF', a: -1.6, b: 0.95, action: 'ois',
  },
  {
    id: 'user', zone: 'left', label: 'USER 1 · 2 · 3', ru: 'Кнопки USER1, USER2, USER3', no: 'Vol.1 с.21 №10',
    desc: 'Три назначаемые кнопки. Каждой можно присвоить одну из 16 функций: ATW, PRE REC, цифровой зум, компенсацию контрового света, шот-марк, INDEX, LAST CLIP, распознавание лиц и другие.',
    ref: 'Vol.2 с.27, 87', kind: 'custom', dist: 16,
  },
  {
    id: 'lcd', zone: 'left', label: 'LCD MONITOR', ru: 'ЖК-монитор 3,45"', no: 'Vol.1 с.21 №9',
    desc: 'Откидной экран 3,45". Открывается на 90° и поворачивается на 180° вперёд (для съёмки себя) или на 90° вниз. Под ним панель кнопок и звука. Кликните по экрану, чтобы открыть или закрыть его. На этой модели картинку на экране меняют START/STOP, BARS, ZEBRA, WFM, DISP, ND, GAIN и WHITE BAL.',
    ref: 'Vol.2 с.6–8', kind: 'custom', dist: 30,
  },
  {
    id: 'menu', zone: 'left', label: 'MENU', ru: 'Кнопка MENU', no: 'Vol.1 с.21 №17',
    desc: 'Открывает и закрывает меню настроек на экране и в видоискателе. Навигация по меню выполняется рычагом OPERATION.',
    ref: 'Vol.1 с.31', kind: 'rbtn', face: 'LB', a: 8.25, b: 8.7,
  },
  {
    id: 'exec', zone: 'left', label: 'EXEC', ru: 'Кнопка EXEC', no: 'Vol.1 с.21 №18',
    desc: 'Кнопка выполнения: подтверждает выбранное действие. Основная навигация и подтверждение в меню делаются рычагом OPERATION.',
    ref: 'Vol.1 с.21', kind: 'rbtn', face: 'LB', a: 11.3, b: 8.7,
  },
  {
    id: 'operation', zone: 'left', label: 'OPERATION', ru: 'Рычаг OPERATION (PUSH-ENTER)', no: 'Vol.1 с.21 №19',
    desc: 'Мини-джойстик с нажатием (PUSH-ENTER). Наклоны вверх, вниз, влево и вправо двигают курсор в меню. При воспроизведении: вверх ▶/II, влево ◀◀, вправо ▶▶, вниз ■ (стоп). Нажатие подтверждает выбор.',
    ref: 'Vol.1 с.31; Vol.2 с.54, 65', kind: 'lever', face: 'LB', a: 9.75, b: 6.75,
  },
  {
    id: 'audMon', zone: 'left', label: 'AUDIO MON/ADV', ru: 'Кнопки AUDIO MON/ADV (− / +)', no: 'Vol.1 с.21 №20',
    desc: 'Две кнопки − и +. Регулируют громкость динамика и наушников при съёмке и воспроизведении. Если воспроизведение на паузе, листают кадры назад и вперёд.',
    ref: 'Vol.2 с.29, 66', kind: 'pair', face: 'LB', a: 9.75, b: 4.9,
  },
  {
    id: 'irisBtn', zone: 'left', label: 'IRIS', ru: 'Кнопка IRIS', no: 'Vol.1 с.21 №24',
    desc: 'Переключает диафрагму между автоматической (AUTO IRIS) и ручной. В ручном режиме диафрагма крутится кольцом IRIS на объективе.',
    ref: 'Vol.2 с.19', kind: 'btn', face: 'LS', a: -5.8, b: 1.3, r: 0.4,
  },
  {
    id: 'gain', zone: 'left', label: 'GAIN', ru: 'Переключатель GAIN', no: 'Vol.1 с.21 №25',
    desc: 'Электронное усиление для тёмных сцен: L / M / H. По умолчанию 0, 6 и 12 dB, значения меняются в меню. Чем больше усиление, тем ярче картинка и тем больше шума.',
    ref: 'Vol.2 с.20', kind: 'sw', face: 'LS', a: -4.45, b: 1.3,
    positions: ['L', 'M', 'H'], state: 'gain', step: 0.34, nub: 0x3a3d42,
  },
  {
    id: 'wb', zone: 'left', label: 'WHITE BAL', ru: 'Переключатель WHITE BAL', no: 'Vol.1 с.21 №26',
    desc: 'Выбор баланса белого. B и A: две ячейки памяти, которые настраиваются кнопкой AWB. PRST: пресет (3200K или 5600K). На одну из позиций можно назначить ATW (автоследящий баланс).',
    ref: 'Vol.2 с.20–22', kind: 'sw', face: 'LS', a: -2.9, b: 1.3,
    positions: ['B', 'A', 'PRST'], state: 'wb', step: 0.34, nub: 0x3a3d42,
  },
  {
    id: 'function', zone: 'left', label: 'FUNCTION', ru: 'Джойстик FUNCTION', no: 'Vol.1 с.21 №27',
    desc: 'Небольшой 4-позиционный переключатель с нажатием. Нажатие вызывает рамку AREA, наклонами её двигают по кадру. Внутри рамки работает функция из меню: автофокус, автодиафрагма или Y GET (замер яркости).',
    ref: 'Vol.2 с.26', kind: 'pad', face: 'LS', a: -0.6, b: 1.3,
  },
  {
    id: 'shtr', zone: 'left', label: 'SHTR/F.RATE', ru: 'Колесо SHTR/F.RATE', no: 'Vol.1 с.21 №28',
    desc: 'Вертикальное колёсико с нажатием. Нажатие включает или выключает затвор, вращение выбирает выдержку, synchro scan или частоту кадров VFR (2–60 к/с для замедления и ускорения). Что именно меняет колесо, задаёт кнопка DIAL SEL.',
    ref: 'Vol.2 с.37–40', kind: 'wheel', face: 'LS', a: 1.25, b: 1.3,
  },
  {
    id: 'dialSel', zone: 'left', label: 'DIAL SEL', ru: 'Кнопка DIAL SEL', no: 'Vol.1 с.21 №29',
    desc: 'Выбирает, чем управляет колесо SHTR/F.RATE: выдержкой (DIAL SHUTTER) или частотой кадров (DIAL FRAME RATE).',
    ref: 'Vol.2 с.37–38', kind: 'rbtn', face: 'LS', a: 2.65, b: 1.3, w: 0.85,
  },
  {
    id: 'disp', zone: 'left', label: 'DISP/MODE CHK', ru: 'Кнопка DISP/MODE CHK', no: 'Vol.1 с.21 №30',
    desc: 'Короткое нажатие показывает или скрывает служебную информацию на экране. Удержание выводит сводку всех текущих настроек (MODE CHECK).',
    ref: 'Vol.2 с.82', kind: 'rbtn', face: 'LS', a: 4.3, b: 1.3, w: 0.85, action: 'disp',
  },
  {
    id: 'autoManu', zone: 'left', label: 'AUTO/MANU', ru: 'Переключатель AUTO/MANU', no: 'Vol.1 с.21 №31',
    desc: 'AUTO: камера сама ведёт фокус, диафрагму, усиление и баланс белого (что именно, задаётся в меню AUTO SW). MANU: всё это вы выставляете вручную.',
    ref: 'Vol.2 с.11, 18', kind: 'sw', face: 'LS', a: 5.95, b: 1.3, horiz: true, posLabels: 'none',
    positions: ['AUTO', 'MANU'], state: 'auto', step: 0.36,
  },
  {
    id: 'lvl1', zone: 'left', label: 'AUDIO LEVEL CH1', ru: 'Ручка уровня звука CH1', no: 'Vol.1 с.21 №32',
    desc: 'Ручная регулировка уровня записи первого канала, когда CH1 стоит в MANU. Ручки прикрыты прозрачной крышкой от случайного поворота. Следите за индикатором на экране: пики не должны упираться в 0 dB.',
    ref: 'Vol.2 с.43', kind: 'knob', face: 'LS', a: 8.3, b: 1.3, r: 0.72, spin: true, pointer: true,
  },
  {
    id: 'lvl2', zone: 'left', label: 'AUDIO LEVEL CH2', ru: 'Ручка уровня звука CH2', no: 'Vol.1 с.21 №32',
    desc: 'Ручная регулировка уровня записи второго канала (при MANU).',
    ref: 'Vol.2 с.43', kind: 'knob', face: 'LS', a: 10.3, b: 1.3, r: 0.72, spin: true, pointer: true,
  },
  {
    id: 'scene', zone: 'left', label: 'SCENE FILE', ru: 'Диск SCENE FILE', no: 'Vol.1 с.21 №16',
    desc: 'Диск под видоискателем с шестью ячейками F1–F6. В каждой хранится набор настроек картинки: гамма, детализация, цвет, уровень чёрного и т.д. Позволяет мгновенно переключаться между «пресетами» под разные условия.',
    ref: 'Vol.2 с.44–46', kind: 'knob', face: 'VL', a: 11.1, b: 12.6, r: 0.7, onFace: true,
    positions: ['F1', 'F2', 'F3', 'F4', 'F5', 'F6'], state: 'scene',
  },

  // ───────── ПАНЕЛЬ ПОД ЖК-ЭКРАНОМ ─────────
  {
    id: 'bars', zone: 'underlcd', label: 'BARS', ru: 'Кнопка BARS', no: 'Vol.1 с.21 №36',
    desc: 'Выводит цветные полосы (color bars), по желанию с тестовым тоном. Нужны, чтобы настроить монитор и записать эталон в начало материала.',
    ref: 'Vol.2 с.28', kind: 'rbtn', face: 'L', a: -1.65, b: 8.15, action: 'bars',
  },
  {
    id: 'evfdtl', zone: 'underlcd', label: 'EVF DTL', ru: 'Кнопка EVF DTL', no: 'Vol.1 с.21 №37',
    desc: 'Подчёркивает контуры (peaking) в видоискателе и на экране, чтобы было легче ловить фокус. На записываемое изображение не влияет.',
    ref: 'Vol.2 с.6', kind: 'rbtn', face: 'L', a: -1.65, b: 6.6,
  },
  {
    id: 'zebra', zone: 'underlcd', label: 'ZEBRA', ru: 'Кнопка ZEBRA', no: 'Vol.1 с.21 №33',
    desc: 'Выводит «зебру»: косую штриховку на участках, близких к пересвету (порог задаётся в меню, например 80% или 100%). Повторные нажатия переключают ZEBRA1, ZEBRA2 и маркер. На запись не влияет.',
    ref: 'Vol.2 с.25', kind: 'rbtn', face: 'L', a: 0.3, b: 6.6, action: 'zebra',
  },
  {
    id: 'lcdBtn', zone: 'underlcd', label: 'LCD', ru: 'Кнопка LCD', no: 'Vol.1 с.21 №38',
    desc: 'Функция задаётся в меню: LCD REV зеркально переворачивает картинку на экране, LCD BL меняет яркость подсветки (5 уровней).',
    ref: 'Vol.2 с.8, 88', kind: 'rbtn', face: 'L', a: -1.65, b: 5.1,
  },
  {
    id: 'wfm', zone: 'underlcd', label: 'WFM', ru: 'Кнопка WFM', no: 'Vol.1 с.21 №34',
    desc: 'Включает осциллограф (вейвформ) или вектороскоп поверх картинки. Помогает объективно контролировать яркость и цвет.',
    ref: 'Vol.2 с.28', kind: 'rbtn', face: 'L', a: 0.3, b: 5.1, action: 'wfm',
  },
  {
    id: 'counter', zone: 'underlcd', label: 'COUNTER', ru: 'Кнопка COUNTER', no: 'Vol.1 с.21 №39',
    desc: 'Переключает, что показывает счётчик на экране: счётчик длительности, таймкод (TC) или user bits (UB).',
    ref: 'Vol.2 с.50', kind: 'rbtn', face: 'L', a: -1.65, b: 3.75,
  },
  {
    id: 'reset', zone: 'underlcd', label: 'RESET/TC SET', ru: 'Кнопка RESET/TC SET', no: 'Vol.1 с.21 №39',
    desc: 'Сбрасывает счётчик. В меню таймкода используется для ввода стартового значения TC и user bits.',
    ref: 'Vol.2 с.50–53', kind: 'rbtn', face: 'L', a: 0.3, b: 3.75,
  },
  {
    id: 'ch1sel', zone: 'underlcd', label: 'CH1 SELECT', ru: 'Выбор источника звука CH1', no: 'Vol.1 с.21 №35',
    desc: 'Что пишется в первый звуковой канал. INT(L): левый канал встроенного микрофона. INPUT1 или INPUT2: разъём XLR на ручке.',
    ref: 'Vol.2 с.41–42', kind: 'sw', face: 'L', a: 2.4, b: 7.1, orange: true,
    positions: ['INT(L)', 'INPUT1', 'INPUT2'], state: 'ch1', step: 0.36,
  },
  {
    id: 'ch2sel', zone: 'underlcd', label: 'CH2 SELECT', ru: 'Выбор источника звука CH2', no: 'Vol.1 с.21 №35',
    desc: 'Что пишется во второй звуковой канал. INT(R): правый канал встроенного микрофона. INPUT2: разъём XLR INPUT 2.',
    ref: 'Vol.2 с.41–42', kind: 'sw', face: 'L', a: 4.55, b: 7.25, orange: true,
    positions: ['INT(R)', 'INPUT2'], state: 'ch2', step: 0.4,
  },
  {
    id: 'audAuto1', zone: 'underlcd', label: 'CH1', ru: 'AUDIO AUTO/MANU CH1', no: 'Vol.1 с.21 №40',
    desc: 'Как регулируется уровень записи первого канала. AUTO: автоматически (ALC). MANU: вручную ручкой AUDIO LEVEL CH1 внизу корпуса.',
    ref: 'Vol.2 с.43', kind: 'sw', face: 'L', a: 2.4, b: 4.55, orange: true,
    positions: ['AUTO', 'MANU'], state: 'aa1', step: 0.46,
  },
  {
    id: 'audAuto2', zone: 'underlcd', label: 'CH2', ru: 'AUDIO AUTO/MANU CH2', no: 'Vol.1 с.21 №40',
    desc: 'То же для второго канала: автоматический или ручной уровень записи.',
    ref: 'Vol.2 с.43', kind: 'sw', face: 'L', a: 4.55, b: 4.55, orange: true,
    positions: ['AUTO', 'MANU'], state: 'aa2', step: 0.46,
  },

  // ───────── ВЕРХНЯЯ РУЧКА ─────────
  {
    id: 'mic', zone: 'handle', label: 'INT MIC  L · R', ru: 'Встроенный стереомикрофон', no: 'Vol.1 с.21 №1',
    desc: 'Стереомикрофон в передней части ручки, решётки L и R сверху и по бокам. Пишется в CH1 и CH2, когда переключатели CH1/CH2 SELECT стоят в INT(L) и INT(R).',
    ref: 'Vol.2 с.41', kind: 'custom', dist: 20,
  },
  {
    id: 'remoteF', zone: 'handle', label: 'REMOTE', ru: 'Датчик пульта (передний)', no: 'Vol.1 с.23 №1',
    desc: 'Глянцевое окно на передней части ручки. За ним ИК-приёмник беспроводного пульта из комплекта.',
    ref: 'Vol.1 с.24', kind: 'sensor', face: 'FBF', a: 0, b: 18.0, w: 4.3, h: 2.45, depth: 0.12, logo: true,
  },
  {
    id: 'tallyF', zone: 'handle', label: 'TALLY', ru: 'Тали-лампа (передняя)', no: 'Vol.1 с.23 №3',
    desc: 'Горит красным во время записи, чтобы человек в кадре это видел. Мигает при предупреждениях. Включается в меню TALLY LAMP. Нажмите START/STOP и посмотрите.',
    ref: 'Vol.2 с.9', kind: 'lamp', face: 'FBF', a: 0.3, b: 17.25, lift: 0.19, color: 0xff2a1a, tally: true, flat: true, small: true,
  },
  {
    id: 'lightSensor', zone: 'handle', label: 'LIGHT SENSOR', ru: 'Датчик внешнего освещения', no: 'Vol.1 с.23 №2',
    desc: 'Определяет тип освещения (дневной или искусственный) и помогает автоматике баланса белого.',
    ref: 'Vol.2', kind: 'lamp', face: 'FBF', a: -0.3, b: 17.25, color: 0xb8bec6, flat: true, small: true, lift: 0.19,
  },
  {
    id: 'shoe', zone: 'handle', label: 'ACCESSORY SHOE', ru: 'Башмак для аксессуаров', no: 'Vol.1 с.22 №16',
    desc: 'Крепление на передней части ручки для накамерного света, приёмника радиосистемы или компактного монитора.',
    ref: 'Vol.1 с.22', kind: 'custom', dist: 16,
  },
  {
    id: 'hZoom', zone: 'handle', label: 'W  T', ru: 'Рычаг зума на ручке', no: 'Vol.1 с.22 №9',
    desc: 'Зум при съёмке с нижнего ракурса, когда камеру держат за ручку. Скорость задаётся переключателем HANDLE ZOOM.',
    ref: 'Vol.2 с.17, 24', kind: 'rocker', face: 'FBT', a: -5.7, b: -0.9, len: 1.9, w: 0.55, axis: 'v',
  },
  {
    id: 'hStart', zone: 'handle', label: 'START/STOP (HANDLE)', ru: 'START/STOP на ручке', no: 'Vol.1 с.22 №15',
    desc: 'Вторая красная кнопка старта и остановки записи, для съёмки с нижнего ракурса. Блокируется рычажком HOLD.',
    ref: 'Vol.2 с.24', kind: 'btn', face: 'FBT', a: -5.55, b: 0.8, r: 0.4, color: 0xd23a33, action: 'rec',
  },
  {
    id: 'hold', zone: 'handle', label: 'HOLD', ru: 'Рычажок HOLD', no: 'Vol.1 с.22 №14',
    desc: 'Рифлёный рычажок у красной кнопки на ручке. Блокирует её, чтобы не включить запись случайно.',
    ref: 'Vol.2 с.24', kind: 'custom', dist: 14,
  },
  {
    id: 'lm1', zone: 'handle', label: 'INPUT1 LINE/MIC', ru: 'LINE/MIC для INPUT1', no: 'Vol.1 с.21 №6',
    desc: 'Какой сигнал ждёт вход INPUT 1. LINE: линейный уровень (пульт, рекордер, радиосистема с линейным выходом). MIC: микрофонный уровень.',
    ref: 'Vol.2 с.42', kind: 'sw', face: 'FBL', a: -11.75, b: 17.45, horiz: true, posLabels: 'below',
    positions: ['LINE', 'MIC'], state: 'lm1', step: 0.46,
  },
  {
    id: 'p48_1', zone: 'handle', label: 'INPUT1 +48V', ru: 'Фантомное питание INPUT1', no: 'Vol.1 с.21 №2',
    desc: 'ON подаёт +48 В на разъём INPUT 1 для конденсаторных микрофонов. Для динамических микрофонов и линейных источников ставьте OFF.',
    ref: 'Vol.2 с.42', kind: 'sw', face: 'FBL', a: -10.4, b: 17.3,
    positions: ['ON', 'OFF'], state: 'p1', step: 0.4,
  },
  {
    id: 'lm2', zone: 'handle', label: 'INPUT2 LINE/MIC', ru: 'LINE/MIC для INPUT2', no: 'Vol.1 с.21 №7',
    desc: 'То же для входа INPUT 2.',
    ref: 'Vol.2 с.42', kind: 'sw', face: 'FBL', a: -8.85, b: 17.45, horiz: true, posLabels: 'below',
    positions: ['LINE', 'MIC'], state: 'lm2', step: 0.46,
  },
  {
    id: 'p48_2', zone: 'handle', label: 'INPUT2 +48V', ru: 'Фантомное питание INPUT2', no: 'Vol.1 с.21 №3',
    desc: 'То же для разъёма INPUT 2.',
    ref: 'Vol.2 с.42', kind: 'sw', face: 'FBL', a: -7.5, b: 17.3,
    positions: ['ON', 'OFF'], state: 'p2', step: 0.4,
  },
  {
    id: 'xlr1', zone: 'handle', label: 'INPUT 1', ru: 'Разъём AUDIO INPUT 1 (XLR)', no: 'Vol.1 с.22 №12',
    desc: 'Профессиональный 3-пиновый вход XLR на правой стороне ручки, для внешнего микрофона или линейного сигнала. Штекер фиксируется защёлкой, для извлечения нажмите PUSH. Может подавать фантомное питание +48 В.',
    ref: 'Vol.2 с.42, 67', kind: 'jack', jack: 'xlr', face: 'FBR', a: -10.95, b: 16.9,
  },
  {
    id: 'xlr2', zone: 'handle', label: 'INPUT 2', ru: 'Разъём AUDIO INPUT 2 (XLR)', no: 'Vol.1 с.22 №12',
    desc: 'Второй вход XLR. Можно подключить два независимых микрофона (например, петличку и пушку).',
    ref: 'Vol.2 с.42, 67', kind: 'jack', jack: 'xlr', face: 'FBR', a: -8.25, b: 16.9,
  },
  {
    id: 'hZoomSw', zone: 'handle', label: 'HANDLE ZOOM', ru: 'Переключатель HANDLE ZOOM', no: 'Vol.1 с.21 №4',
    desc: 'Три фиксированные скорости зума для рычага на ручке: 1 — самая медленная, 3 — самая быстрая. Удобно для плавных «наездов» на нижнем ракурсе.',
    ref: 'Vol.2 с.17', kind: 'sw', face: 'HBL', a: -1.9, b: 17.65, horiz: true, posLabels: 'above', labelPos: 'right',
    positions: ['1', '2', '3'], state: 'hz', step: 0.3,
  },
  {
    id: 'strapMount', zone: 'handle', label: 'STRAP MOUNT', ru: 'Крепления плечевого ремня', no: 'Vol.1 с.22 №8',
    desc: 'Две проушины на ручке, спереди и сзади, для плечевого ремня из комплекта.',
    ref: 'Vol.1: «Attaching the shoulder strap»', kind: 'custom', dist: 30,
  },
  {
    id: 'vf', zone: 'handle', label: 'VIEWFINDER', ru: 'Видоискатель', no: 'Vol.1 с.23 №7',
    desc: 'Цветной LCOS-видоискатель 0,45" на 1,23 млн точек с большим наглазником. Незаменим на ярком солнце, когда на экране ничего не видно.',
    ref: 'Vol.2 с.5', kind: 'custom', dist: 26,
  },
  {
    id: 'diopter', zone: 'handle', label: 'DIOPTER', ru: 'Кольцо диоптрийной подстройки', no: 'Vol.1 с.21 №5',
    desc: 'Рифлёное кольцо у наглазника. Подстраивает резкость изображения в видоискателе под зрение оператора и на запись не влияет.',
    ref: 'Vol.2 с.5', kind: 'custom', dist: 16,
  },

  // ───────── ПРАВАЯ СТОРОНА ─────────
  {
    id: 'zoomLever', zone: 'right', label: 'W  T', ru: 'Рычаг зума W/T', no: 'Vol.1 с.22 №11',
    desc: 'Основной моторный зум на рукоятке под указательным и средним пальцами. T приближает, W отдаляет. Чем сильнее нажим, тем быстрее зум. Работает при ZOOM в положении SERVO.',
    ref: 'Vol.2 с.17', kind: 'rocker', face: 'GT', a: -3.6, b: 6.6, len: 3.4, w: 0.95, axis: 'v',
  },
  {
    id: 'recCheck', zone: 'right', label: 'REC CHECK', ru: 'Кнопка REC CHECK', no: 'Vol.1 с.22 №10',
    desc: 'В паузе записи проигрывает последние ~3 секунды снятого, чтобы убедиться, что запись прошла.',
    ref: 'Vol.2 с.12', kind: 'btn', face: 'GT', a: -0.9, b: 6.6, r: 0.36,
  },
  {
    id: 'speaker', zone: 'right', label: 'SPEAKER', ru: 'Встроенный динамик', no: 'Vol.1 с.23 №4',
    desc: 'Звук при воспроизведении и сигналы. Если подключены наушники, динамик замолкает.',
    ref: 'Vol.2 с.66–67', kind: 'custom', dist: 16,
  },
  {
    id: 'grip', zone: 'right', label: 'HAND STRAP', ru: 'Рукоятка и ремень', no: '',
    desc: 'Правая рука проходит под мягкий ремень на липучке. Указательный и средний пальцы лежат на рычаге W/T, большой палец на START/STOP сзади рукоятки.',
    ref: 'Vol.1: «Adjusting the hand strap»', kind: 'custom', dist: 30,
  },
  {
    id: 'power', zone: 'right', label: 'POWER  OFF · ON · MODE', ru: 'Переключатель POWER/MODE', no: 'Vol.1 с.22 №4',
    desc: 'Поворотный переключатель на задней стороне рукоятки: OFF, ON и подпружиненное MODE. Каждый поворот в MODE переключает камеру между съёмкой (CAMERA) и воспроизведением (PB). Из OFF поворачивается только с нажатым белым фиксатором.',
    ref: 'Vol.1 с.30; Vol.2 с.54', kind: 'custom', dist: 15,
    positions: ['OFF', 'ON', 'MODE'], state: 'power',
  },
  {
    id: 'start', zone: 'right', label: 'START/STOP', ru: 'Кнопка START/STOP', no: 'Vol.1 с.22 №6',
    desc: 'Главная красная кнопка записи в центре переключателя POWER, прямо под большим пальцем. Нажмите и посмотрите: загорятся тали-лампы, на экране появится REC.',
    ref: 'Vol.2 с.10', kind: 'custom', dist: 13, action: 'rec',
  },
  {
    id: 'lockRel', zone: 'right', label: 'LOCK', ru: 'Фиксатор переключателя POWER', no: 'Vol.1 с.22 №5',
    desc: 'Маленький белый фиксатор на кольце POWER. Чтобы повернуть переключатель из OFF, его нужно сдвинуть. Защита от случайного включения.',
    ref: 'Vol.1 с.30', kind: 'custom', dist: 12,
  },
  {
    id: 'modeLamp', zone: 'right', label: 'CAMERA / PB', ru: 'Лампы режима', no: 'Vol.1 с.22 №3',
    desc: 'Два светодиода над переключателем POWER показывают режим: CAMERA (съёмка) или PB (воспроизведение). Режим меняется поворотом POWER в MODE.',
    ref: 'Vol.2 с.54', kind: 'custom', dist: 13,
  },
  {
    id: 'caps', zone: 'right', label: 'A/V OUT', ru: 'Крышка A/V OUT', no: 'Vol.1 с.22 №7',
    desc: 'Резиновая крышка на правой стороне сзади, под ней аналоговые выходы видео и звука. Все разъёмы камеры закрыты такими заглушками от пыли и влаги. Кликните, чтобы открыть.',
    ref: 'Vol.1 с.22', kind: 'custom', dist: 16,
  },
  {
    id: 'videoOut', zone: 'right', label: 'VIDEO OUT', ru: 'Выход VIDEO OUT (TC PRESET IN/OUT)', no: 'Vol.1 с.22 №1',
    desc: 'Композитный видеовыход (RCA, жёлтый) для SD-монитора. Используется и для синхронизации таймкода между камерами (TC PRESET IN/OUT).',
    ref: 'Vol.2 с.70–71', kind: 'custom', dist: 12,
  },
  {
    id: 'audioOut', zone: 'right', label: 'AUDIO OUT CH1/CH2', ru: 'Аудиовыходы CH1/CH2', no: 'Vol.1 с.22 №2',
    desc: 'Линейные аудиовыходы (RCA, белый и красный): звук на внешний монитор, рекордер или пульт.',
    ref: 'Vol.2 с.70', kind: 'custom', dist: 12,
  },

  // ───────── ЗАД ─────────
  {
    id: 'cardDoor', zone: 'rear', label: 'CARD DOOR · OPEN', ru: 'Крышка слотов карт', no: 'Vol.1 с.23 №8',
    desc: 'Узкая дверца сзади слева (с окошком, через которое видны карты) закрывает два слота SD/SDHC/SDXC. Открывается движком OPEN. Кликните, чтобы открыть.',
    ref: 'Vol.1 с.23', kind: 'custom', dist: 18,
  },
  {
    id: 'slots', zone: 'rear', label: 'SLOT 1 / SLOT 2', ru: 'Слоты карт и лампы доступа', no: 'Vol.1 с.23 №9',
    desc: 'Два вертикальных слота SD-карт. Запись идёт по очереди (Relay), одновременно на обе (Simul Rec) или на одну. Лампа доступа горит, пока идёт запись или чтение, и в это время карту вынимать нельзя.',
    ref: 'Vol.2 с.12–16, 31–32', kind: 'custom', dist: 15,
  },
  {
    id: 'slotSel', zone: 'rear', label: 'SLOT SEL', ru: 'Кнопка SLOT SEL', no: 'Vol.1 с.23 №15',
    desc: 'Переключает активный слот карты, на который идёт запись.',
    ref: 'Vol.2 с.12', kind: 'btn', face: 'B', a: -2.85, b: 1.25, r: 0.3, action: 'slot',
  },
  {
    id: 'hdInd', zone: 'rear', label: 'HD', ru: 'Индикатор HD', no: 'Vol.1 с.23 №14',
    desc: 'Светодиод рядом с кнопкой SLOT SEL: показывает, что камера работает в HD-режиме.',
    ref: 'Vol.1 с.23', kind: 'lamp', face: 'B', a: -3.75, b: 1.25, color: 0x3aa0ff, on: true, flat: true, small: true,
  },
  {
    id: 'remoteR', zone: 'rear', label: 'REMOTE / TALLY (REAR)', ru: 'Окно датчика пульта и задней тали-лампы', no: 'Vol.1 с.23 №10–11',
    desc: 'Маленькое окошко сзади слева внизу. За ним второй ИК-приёмник пульта (для управления из-за камеры) и задняя лампа записи.',
    ref: 'Vol.1 с.24; Vol.2 с.9', kind: 'sensor', face: 'B', a: -4.55, b: 1.25, w: 0.55, h: 0.36, tally: true,
  },
  {
    id: 'usb', zone: 'rear', label: 'USB 2.0', ru: 'Разъём USB 2.0', no: 'Vol.1 с.23 №17',
    desc: 'Под резиновой крышкой разъём Mini-B USB. Камера подключается к компьютеру как накопитель, и файлы с карт можно копировать для монтажа.',
    ref: 'Vol.2 с.68, 72', kind: 'port', face: 'B', a: -1.5, b: 9.0, w: 1.75, h: 2.8, jacks: [{ jack: 'usb' }],
  },
  {
    id: 'hdmi', zone: 'rear', label: 'HDMI', ru: 'Выход HDMI', no: 'Vol.1 с.23 №22',
    desc: 'Полноразмерный HDMI под крышкой, на телевизор или монитор. Формат выхода задаётся в меню AV OUT SETUP.',
    ref: 'Vol.2 с.70–71, 92', kind: 'port', face: 'B', a: -1.5, b: 5.9, w: 1.75, h: 3.0, jacks: [{ jack: 'hdmi', rot: true }],
  },
  {
    id: 'dv', zone: 'rear', label: 'DV OUT', ru: 'Выход DV (IEEE1394)', no: 'Vol.1 с.23 №23',
    desc: '6-пиновый FireWire. Работает только в DV-режиме: передача на компьютер и резервная запись на внешний рекордер.',
    ref: 'Vol.2 с.33, 69', kind: 'port', face: 'B', a: -1.5, b: 2.7, w: 1.75, h: 3.0, jacks: [{ jack: 'dv', rot: true }],
  },
  {
    id: 'phones', zone: 'rear', label: '🎧', ru: 'Выход на наушники', no: 'Vol.1 с.23 №18',
    desc: 'Стерео-миниджек 3,5 мм. Громкость регулируется кнопками AUDIO MON/ADV. Когда наушники подключены, динамик отключается.',
    ref: 'Vol.2 с.29, 67', kind: 'port', face: 'B', a: 0.35, b: 9.4, w: 1.7, h: 2.0, jacks: [{ jack: 'mini' }],
  },
  {
    id: 'indexRem', zone: 'rear', label: 'INDEX', ru: 'Разъём INDEX REMOTE', no: 'Vol.1 с.23 №19',
    desc: 'Субминиджек 2,5 мм для внешнего пульта, который ставит индекс-метки в клип.',
    ref: 'Vol.1 с.23', kind: 'port', face: 'B', a: 0.35, b: 7.35, w: 1.7, h: 1.9, jacks: [{ jack: 'mini', small: true }],
  },
  {
    id: 'camRem', zone: 'rear', label: 'CAM REMOTE', ru: 'Разъёмы CAM REMOTE', no: 'Vol.1 с.23 №20',
    desc: 'Два гнезда для проводного пульта, например на ручке штатива. FOCUS/IRIS (миниджек 3,5 мм) управляет фокусом и диафрагмой, ZOOM S/S (субминиджек 2,5 мм) — зумом и стартом/стопом записи.',
    ref: 'Vol.1 с.23', kind: 'port', face: 'B', a: 0.35, b: 5.3, w: 1.7, h: 2.0, jacks: [{ jack: 'mini', dy: 0.4 }, { jack: 'mini', small: true, dy: -0.45 }],
  },
  {
    id: 'sdi', zone: 'rear', label: 'SDI OUT', ru: 'Выход HD-SDI', no: 'Vol.1 с.23 №21',
    desc: 'Профессиональный цифровой видеовыход (BNC) на мониторы, рекордеры и видеомикшеры, работает на длинных кабелях. Есть у AC160A и нет у AC130A.',
    ref: 'Vol.2 с.70–71', kind: 'port', face: 'B', a: 0.35, b: 2.55, w: 1.7, h: 3.3, jacks: [{ jack: 'bnc' }],
  },
  {
    id: 'battery', zone: 'rear', label: 'BATTERY', ru: 'Отсек аккумулятора', no: 'Vol.1 с.23 №13',
    desc: 'Аккумулятор 7,2 В вставляется сзади справа. Остаток заряда в минутах видно на экране (для совместимых батарей Panasonic). Кликните, чтобы снять или вставить аккумулятор.',
    ref: 'Vol.1 с.25–26', kind: 'custom', dist: 28,
  },
  {
    id: 'battRel', zone: 'rear', label: 'PUSH', ru: 'Кнопка снятия аккумулятора', no: 'Vol.1 с.23 №12',
    desc: 'Маленькая кнопка PUSH над отсеком. Удерживайте её и сдвиньте аккумулятор, чтобы снять его.',
    ref: 'Vol.1 с.26', kind: 'rbtn', face: 'B', a: 4.15, b: 10.5, w: 0.7,
  },

  // ───────── ПЕРЕД И НИЗ ─────────
  {
    id: 'awb', zone: 'bottom', label: 'AWB', ru: 'Кнопка AWB', no: 'Vol.1 с.23 №5',
    desc: 'Автоматическая настройка баланса белого по белому листу, когда WHITE BAL стоит в A или B. Результат запоминается в выбранную ячейку. Долгое нажатие запускает баланс чёрного (ABB). Расположена спереди на корпусе под объективом (на модели положение примерное).',
    ref: 'Vol.2 с.21–22', kind: 'btn', face: 'F2', a: -3.6, b: 1.35, r: 0.36,
  },
  {
    id: 'tripod', zone: 'bottom', label: 'TRIPOD', ru: 'Штативное гнездо', no: 'Vol.1 с.23 №6',
    desc: 'Резьба на дне корпуса для штативной площадки. Рядом отверстие под штифт, чтобы камера не проворачивалась.',
    ref: 'Vol.1 с.23', kind: 'custom', dist: 24,
  },
];
