import type { ContentPack, Task } from '../engine/content';

// Only directly matching exercises photographed by the owner: Mоро et al.,
// Mathematics grade 4, part 1, 16th stereot. ed., Prosveshchenie 2026.
// The photographed pages are not distributed with the app. Every entry is
// reviewed in docs/SOURCE_AUDIT.md; references alone never grant access.
const approved: Record<string, { page: number; exercise: string | string[]; ids: string[] }> = {
  'clock-day-hours': { page: 48, exercise: '230', ids: ['night', 'morning', 'afternoon'] },
  'time-units-table': {
    page: 51,
    exercise: ['254', '258'],
    ids: ['day-remaining', 'stride-distance', 'doctor-alarm'],
  },
  'clock-spoken-time': { page: 48, exercise: '231', ids: ['quarter', 'half', 'before'] },
  'equations-add-subtract': {
    page: 46,
    exercise: '219',
    ids: ['add-left', 'add-right', 'minuend', 'subtrahend'],
  },
  'multiply-divide-powers-ten': {
    page: 46,
    exercise: '220',
    ids: ['power-1', 'power-2', 'power-3', 'power-4'],
  },
  'area-equal-parts': { page: 46, exercise: '221', ids: ['square-1'] },
  'division-restore-dividend': {
    page: 47,
    exercise: '226',
    ids: ['restore-1', 'restore-2', 'restore-3', 'restore-4'],
  },
  'place-value-calculations': {
    page: 47,
    exercise: '227',
    ids: ['place-1', 'place-2', 'place-3', 'place-4', 'place-5', 'place-6', 'place-7', 'place-8'],
  },
  'calendar-years-months': {
    page: 47,
    exercise: 'нижние задания',
    ids: ['four-years', 'two-three'],
  },
  // Page 75 is the second variant of the same test table: ten numbered questions,
  // still without exercise numbers.
  'page-75-test': {
    page: 75,
    exercise: 'тест',
    ids: ['v2-1', 'v2-2', 'v2-3', 'v2-4', 'v2-5', 'v2-6', 'v2-7', 'v2-8', 'v2-9', 'v2-10'],
  },
  // Page 74 is the test table: ten numbered questions without exercise numbers.
  'page-74-test': {
    page: 74,
    exercise: 'тест',
    ids: [
      'test-1',
      'test-2',
      'test-3',
      'test-4',
      'test-5',
      'test-6',
      'test-7',
      'test-8',
      'test-9',
      'test-10',
    ],
  },
};

export const approvedTaskIds = approved;

/**
 * Author's exercises approved by the owner one by one (SOURCE-03, AUTHOR-01).
 * They are NOT textbook exercises: no page, no exercise number, and the app
 * never attributes them to Moro. Approval is recorded in docs/PRODUCT_RULES.md.
 */
const authorApproved: Record<string, { approvedOn: string; decision: string; ids: string[] }> = {
  'time-units-table': {
    approvedOn: '2026-11-11',
    decision:
      'Владелец попросил добавить таблицу единиц времени и задачи по присланной фотографии страниц 50–51; задания на перевод единиц составлены как авторские дополнения',
    ids: ['century-years', 'hours-minutes', 'minutes-seconds', 'year-days', 'month-length'],
  },
  'roman-numerals': {
    approvedOn: '2026-11-06',
    decision: 'Владелец утвердил три задания из банка как авторское дополнение',
    ids: ['roman-four', 'roman-nine', 'roman-twelve'],
  },
};

export const authorApprovedTaskIds = authorApproved;

const authorSignatures: Record<string, string> = {
  'time-units-table/century-years': 'Сколько лет в 4 веках?||400',
  'time-units-table/hours-minutes': 'Сколько минут в 2 ч 15 мин?||135',
  'time-units-table/minutes-seconds': 'Сколько секунд в 3 минутах?||180',
  'time-units-table/year-days': 'Сколько суток в обычном, не високосном году?||365',
  'time-units-table/month-length': 'Какое утверждение о числе суток в месяце верное?||"b"',
  'roman-numerals/roman-four': 'Какой месяц обозначен IV?||"a"',
  'roman-numerals/roman-nine': 'Какой месяц обозначен IX?||"b"',
  'roman-numerals/roman-twelve': 'Какой месяц обозначен XII?||"c"',
};

/** True when the exercise is an approved author's addition, not a textbook one. */
export function isAuthorTask(topicId: string, taskId: string): boolean {
  return Boolean(authorApproved[topicId]?.ids.includes(taskId));
}

// Do not allow a stale allowlist to silently approve an edited exercise.
// Values are a deliberately small snapshot of the question and its operands.
const clockChoiceSignatures: Record<string, string> = {
  quarter:
    '[{"id":"a","label":"4 ч 15 мин"},{"id":"b","label":"4 ч 30 мин"},{"id":"c","label":"5 ч 15 мин"}]',
  half: '[{"id":"a","label":"12 ч 30 мин"},{"id":"b","label":"1 ч 30 мин"},{"id":"c","label":"12 ч 15 мин"}]',
  before:
    '[{"id":"a","label":"6 ч 45 мин"},{"id":"b","label":"7 ч 15 мин"},{"id":"c","label":"7 ч 45 мин"}]',
};
const approvedSignatures: Record<string, string> = {
  'clock-spoken-time/quarter':
    'Как сказать по-другому: четверть пятого? Выбери время по 12-часовым часам.||"a"',
  'clock-spoken-time/half':
    'Как сказать по-другому: половина первого? Выбери время по 12-часовым часам.||"a"',
  'clock-spoken-time/before':
    'Как сказать по-другому: без четверти семь? Выбери время по 12-часовым часам.||"a"',
  'clock-day-hours/night': 'Сколько времени прошло от начала суток, если сейчас 2 ч ночи?||2',
  'clock-day-hours/morning': 'Сколько времени прошло от начала суток, если сейчас 9 ч утра?||9',
  'clock-day-hours/afternoon': 'Сколько времени прошло от начала суток, если сейчас 3 ч дня?||15',
  'equations-add-subtract/add-left': 'Найди x: 100 + x = 370.||270',
  'equations-add-subtract/add-right': 'Найди x: x + 330 = 500.||170',
  'equations-add-subtract/minuend': 'Найди x: x − 270 = 630.||900',
  'equations-add-subtract/subtrahend': 'Найди x: 400 − x = 130.||270',
  'multiply-divide-powers-ten/power-1': 'Вычисли значение выражения.|7 000 × 100 + 6 000|706000',
  'multiply-divide-powers-ten/power-2': 'Вычисли значение выражения.|8 600 × 100 − 60 000|800000',
  'multiply-divide-powers-ten/power-3': 'Вычисли значение выражения.|999 999 + 1|1000000',
  'multiply-divide-powers-ten/power-4': 'Вычисли значение выражения.|1 000 000 : 10|100000',
  'area-equal-parts/square-1':
    'Квадрат со стороной 8 см разрезали на 4 равных треугольника. Найди площадь одного.||16',
  'division-restore-dividend/restore-1':
    'Неизвестное число разделили на 8. Получили неполное частное 8 и остаток 6. Найди это число.||70',
  'division-restore-dividend/restore-2':
    'Неизвестное число разделили на 7. Получили неполное частное 106 и остаток 5. Найди это число.||747',
  'division-restore-dividend/restore-3':
    'Неизвестное число разделили на 30. Получили неполное частное 2 и остаток 20. Найди это число.||80',
  'division-restore-dividend/restore-4':
    'Неизвестное число разделили на 57. Получили неполное частное 1 и остаток 2. Найди это число.||59',
  'place-value-calculations/place-1': 'Вычисли по разрядам.|23 000 + 25|23025',
  'place-value-calculations/place-2': 'Вычисли по разрядам.|18 000 + 350|18350',
  'place-value-calculations/place-3': 'Вычисли по разрядам.|37 000 + 480|37480',
  'place-value-calculations/place-4': 'Вычисли по разрядам.|7 050 − 7 000|50',
  'place-value-calculations/place-5': 'Вычисли по разрядам.|6 080 − 6 000|80',
  'place-value-calculations/place-6': 'Вычисли по разрядам.|8 090 − 8 040|50',
  'place-value-calculations/place-7': 'Вычисли по разрядам.|69 875 − 800 − 70|69005',
  'place-value-calculations/place-8': 'Вычисли по разрядам.|43 546 − 40 000 − 40|3506',
  'calendar-years-months/four-years': 'Сколько месяцев в 4 годах?||48',
  'calendar-years-months/two-three': 'Вырази 2 года 3 месяца в месяцах.||27',
  'time-units-table/day-remaining':
    'Сейчас 8 часов утра. Во сколько раз оставшаяся часть суток больше прошедшей?||2',
  'time-units-table/stride-distance':
    'Мальчик делает 2 шага в секунду, каждый по 40 см. Какое расстояние он пройдёт за 10 минут? Ответ дай в метрах.||480',
  'time-units-table/doctor-alarm':
    'Врач лёг спать в 9 часов вечера. На следующий день ему нужно быть в больнице к 11 часам утра, поэтому будильник он поставил на 10 утра. Через сколько часов прозвонит будильник?||13',
  'page-74-test/test-1': 'Какое число надо прибавить к числу 5 300, чтобы получить 6 000?||"b"',
  'page-74-test/test-2': 'Из какого числа вычли 800, если получили 700?||"a"',
  'page-74-test/test-3': 'Значение какого выражения равно 2 800?||"b"',
  'page-74-test/test-4': 'Укажи значение числового выражения.|(600 + 240) : 7 + 80|"b"',
  'page-74-test/test-5':
    'Какой знак сравнения надо поставить в кружок, чтобы получить верное неравенство?||3 800 − (1 900 − 900)|3 800 − 1 900|">"',
  'page-74-test/test-6':
    'Выбери верное выражение для решения задачи: «Оля сорвала 15 тюльпанов. Несколько тюльпанов она поставила в 2 вазы, по 3 тюльпана в каждую, а остальные связала в букет. Сколько тюльпанов в букете?»||"b"',
  'page-74-test/test-7': 'Укажи правильно вычисленную сумму чисел 48 679 и 32 976.||"b"',
  'page-74-test/test-8': 'Укажи правильно вычисленную разность чисел 72 435 и 25 796.||"b"',
  'page-74-test/test-9':
    'Какое число надо записать в окошко, чтобы стало верным равенство 8 200 + □ = 10 000 − 1 000?||"b"',
  'page-74-test/test-10': 'Какой может быть длина нового чертёжного карандаша?||"c"',
  'page-75-test/v2-1': 'Какое число надо прибавить к числу 2 400, чтобы получить 4 000?||"a"',
  'page-75-test/v2-2': 'Из какого числа вычли 300, если получили 900?||"c"',
  'page-75-test/v2-3': 'Значение какого выражения равно 1 600?||"c"',
  'page-75-test/v2-4': 'Укажи значение числового выражения.|(980 − 350) : 9 + 100|"a"',
  'page-75-test/v2-5':
    'Какой знак сравнения надо поставить в кружок, чтобы получить верное неравенство?||5 600 − (300 + 600)|5 600 − 300 + 600|"<"',
  'page-75-test/v2-6':
    'Выбери верное выражение для решения задачи: «В 2 одинаковые банки с ананасовым компотом кладут 18 кружков ананаса. Сколько кружков ананаса нужно положить в 6 таких банок?»||"b"',
  'page-75-test/v2-7': 'Укажи правильно вычисленную сумму чисел 38 697 и 42 538.||"b"',
  'page-75-test/v2-8': 'Укажи правильно вычисленную разность чисел 81 423 и 29 873.||"b"',
  'page-75-test/v2-9':
    'Какое число надо записать в окошко, чтобы стало верным равенство 9 400 + □ = 10 250 − 250?||"a"',
  'page-75-test/v2-10': 'Какой может быть масса кошки, которой один год?||"b"',
};

export function taskApproved(grade: number, topicId: string, task: Task): boolean {
  if (grade !== 4) return false;
  // A compared inequality is itself the condition: lock both sides, not only the sign.
  const signature =
    task.type === 'compare'
      ? `${task.question}|${task.expression ?? ''}|${task.left}|${task.right}|${JSON.stringify(task.answer)}`
      : `${task.question}|${task.expression ?? ''}|${JSON.stringify(task.answer)}`;
  if (approved[topicId]?.ids.includes(task.id)) {
    if (
      topicId === 'clock-spoken-time' &&
      (task.type !== 'choice' || JSON.stringify(task.options) !== clockChoiceSignatures[task.id])
    )
      return false;
    return approvedSignatures[`${topicId}/${task.id}`] === signature;
  }
  // An edited author's exercise closes just like an edited textbook one.
  if (authorApproved[topicId]?.ids.includes(task.id))
    return authorSignatures[`${topicId}/${task.id}`] === signature;
  return false;
}

export function visiblePack(pack: ContentPack): ContentPack {
  const topics = pack.topics.flatMap((topic) => {
    const tasks = topic.tasks.filter((task) => taskApproved(pack.grade, topic.id, task));
    return tasks.length
      ? [{ ...topic, tasks, lessonSize: Math.min(topic.lessonSize ?? 5, tasks.length) }]
      : [];
  });
  const sections = pack.sections?.flatMap((section) => {
    const topicIds = section.topicIds.filter((id) => topics.some((topic) => topic.id === id));
    return topicIds.length ? [{ ...section, topicIds }] : [];
  });
  return { ...pack, topics, sections };
}
