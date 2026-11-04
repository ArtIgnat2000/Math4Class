import type { ContentPack, Task } from '../engine/content';

// Only directly matching exercises photographed by the owner: Mоро et al.,
// Mathematics grade 4, part 1, 16th stereot. ed., Prosveshchenie 2026.
// The photographed pages are not distributed with the app. Every entry is
// reviewed in docs/SOURCE_AUDIT.md; references alone never grant access.
const approved: Record<string, { page: number; exercise: string; ids: string[] }> = {
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
};

export const approvedTaskIds = approved;

// Do not allow a stale allowlist to silently approve an edited exercise.
// Values are a deliberately small snapshot of the question and its operands.
const approvedSignatures: Record<string, string> = {
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
};

export function taskApproved(grade: number, topicId: string, task: Task): boolean {
  if (grade !== 4 || !approved[topicId]?.ids.includes(task.id)) return false;
  return (
    approvedSignatures[`${topicId}/${task.id}`] ===
    `${task.question}|${task.expression ?? ''}|${JSON.stringify(task.answer)}`
  );
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
