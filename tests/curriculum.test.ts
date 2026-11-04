import { describe, expect, it } from 'vitest';
import { BUILTIN_PACKS, getPack } from '../src/content';
import legacyExample from '../public/content/example-grade-4.json';
import { parsePack, referenceSchema, taskSchema, type Task } from '../src/engine/content';
import { answerLabel, checkAnswer } from '../src/engine/answers';
import { appDataSchema, createAppData, createProfile } from '../src/engine/model';
import { createSession, finishSession, nextTask, submitAnswer } from '../src/engine/lesson';
import { referenceDescription, referenceLabel } from '../src/engine/references';
import { readData, writeData } from '../src/state/storage';

const pack = BUILTIN_PACKS[4];
const topic = (id: string) => pack.topics.find((t) => t.id === id)!;
const task = (topicId: string, id: string) => topic(topicId).tasks.find((t) => t.id === id)!;
const division = task('division-remainder', 'divide-74-8');
const newTopics = pack.topics.filter((t) => !t.isDemo);

// A small independent test-only arithmetic parser, not an app feature or eval.
function calculate(expression: string): number {
  const source = expression.replace(/\s/g, '');
  const tokens = source.match(/\d+|[+−×:()]/g) ?? [];
  if (tokens.join('') !== source) throw new Error(`Unsupported expression: ${expression}`);
  let cursor = 0;
  function atom(): number {
    if (tokens[cursor] === '(') {
      cursor++;
      const value = sum();
      if (tokens[cursor++] !== ')') throw new Error('Missing bracket');
      return value;
    }
    const token = tokens[cursor++];
    if (!token || !/^\d+$/.test(token)) throw new Error('Expected number');
    return Number(token);
  }
  function product(): number {
    let value = atom();
    while (tokens[cursor] === '×' || tokens[cursor] === ':') {
      const op = tokens[cursor++];
      const right = atom();
      value = op === '×' ? value * right : value / right;
    }
    return value;
  }
  function sum(): number {
    let value = product();
    while (tokens[cursor] === '+' || tokens[cursor] === '−') {
      const op = tokens[cursor++];
      const right = product();
      value = op === '+' ? value + right : value - right;
    }
    return value;
  }
  const result = sum();
  if (cursor !== tokens.length) throw new Error('Unexpected tokens');
  return result;
}
function expectNumber(topicId: string, id: string, expected: number) {
  const value = task(topicId, id);
  expect(value.type).toBe('number');
  expect(value.answer, `${topicId}/${id}`).toBe(expected);
}

describe('School of Russia scope and backwards compatibility', () => {
  it('identifies the actual photographed edition without claiming a complete course', () => {
    expect(pack.curriculum).toMatchObject({
      series: 'Школа России',
      year: 2026,
      part: 1,
      publisher: 'Просвещение',
      edition: '16-е издание, стереотипное',
    });
    expect(pack.curriculum?.authors).toEqual([
      'М. И. Моро',
      'М. А. Бантова',
      'Г. В. Бельтюкова',
      'С. И. Волкова',
      'С. В. Степанова',
    ]);
    expect(pack.curriculum?.coverage).toContain('не полный курс');
    expect(pack.isDemo).toBe(false);
    expect(pack.topics).toHaveLength(35);
    expect(newTopics).toHaveLength(27);
    expect(newTopics.every((t) => t.tasks.length === 8 && t.lessonSize === 5)).toBe(true);
    expect(pack.topics.reduce((n, t) => n + t.tasks.length, 0)).toBe(256);
  });
  it('separates 20 page-based, 7 contents-based and 8 introductory topics', () => {
    expect(pack.topics.filter((t) => t.reference?.kind === 'page')).toHaveLength(20);
    const outline = pack.topics.filter((t) => t.reference?.kind === 'contents');
    expect(outline.map((t) => t.reference?.pages)).toEqual([
      [76],
      [77],
      [77],
      [79],
      [80],
      [81],
      [82],
    ]);
    const intro = pack.topics.filter((t) => t.isDemo);
    expect(intro.map((t) => t.id)).toEqual([
      'large-numbers',
      'addition',
      'multiplication',
      'quantities',
      'fractions',
      'geometry',
      'word-problems',
      'expressions',
    ]);
    expect(intro.every((t) => t.reference?.kind === 'intro')).toBe(true);
    expect(pack.sections?.map((s) => s.topicIds.length)).toEqual([4, 6, 10, 7, 8]);
    expect(new Set(pack.sections?.flatMap((s) => s.topicIds)).size).toBe(35);
  });
  it('rejects unknown, duplicate or missing section membership', () => {
    const sections = pack.sections!;
    for (const topicIds of [
      sections[0].topicIds.slice(1),
      [...sections[0].topicIds, 'unknown-topic'],
      [...sections[0].topicIds, sections[1].topicIds[0]],
    ]) {
      expect(() =>
        parsePack({ ...pack, sections: [{ ...sections[0], topicIds }, ...sections.slice(1)] }),
      ).toThrow('Каждая тема должна входить ровно в один раздел');
    }
    expect(() => parsePack({ ...pack, sections: [sections[0], ...sections] })).toThrow(
      'ID разделов не повторяются',
    );
  });
  it('requires a source page and distinguishes inferred topics in labels and notes', () => {
    expect(referenceSchema.safeParse({ kind: 'page', pages: [] }).success).toBe(false);
    expect(referenceSchema.safeParse({ kind: 'intro', pages: [] }).success).toBe(true);
    expect(referenceLabel(topic('mass-kg-g').reference)).toBe('По фото · стр. 46');
    expect(referenceLabel(topic('written-division').reference)).toBe('Оглавление · стр. 82');
    expect(referenceDescription(topic('written-division').reference!)).toContain(
      'Сами эти страницы не присланы',
    );
    expect(referenceDescription(topic('division-remainder').reference!)).toContain(
      'упражнения 218',
    );
  });
  it('accepts a v1 pack with none of the new optional metadata and preserves custom overrides', () => {
    const legacy = parsePack(legacyExample);
    expect(legacy.curriculum).toBeUndefined();
    expect(legacy.sections).toBeUndefined();
    expect(getPack(4, [legacy]).topics).toHaveLength(0);
    expect(getPack(4, []).topics.reduce((n, t) => n + t.tasks.length, 0)).toBe(23);
    const data = createAppData();
    data.customPacks = [legacy];
    expect(appDataSchema.safeParse(data).success).toBe(true);
    expect(writeData(data, localStorage)).toBe(true);
    expect(readData(localStorage).data.customPacks[0]).toEqual(legacy);
  });
});

describe('independently checked authored mathematics', () => {
  it('evaluates every new numeric arithmetic expression independently', () => {
    const tasks = newTopics
      .flatMap((t) => t.tasks)
      .filter((t) => t.type === 'number' && t.expression);
    expect(tasks.length).toBeGreaterThanOrEqual(50);
    for (const t of tasks) expect(calculate(t.expression!), t.id).toBe(t.answer);
  });
  it('checks every new equation by substitution rather than comparing answer strings', () => {
    const equations = [
      ...topic('equations-add-subtract').tasks,
      ...topic('equations-multiply-divide').tasks,
    ].filter((t) => t.type === 'number');
    expect(equations).toHaveLength(15);
    for (const t of equations) {
      const equation = t.question.match(/^Найди x: (.+)\.$/)![1];
      const [left, right] = equation.replaceAll('x', String(t.answer)).split('=');
      expect(calculate(left), t.id).toBe(calculate(right));
    }
  });
  it('checks mass comparisons and ordering in the same base unit', () => {
    function grams(label: string): number {
      const factors: Record<string, number> = { г: 1, кг: 1000, ц: 100000, т: 1000000 };
      const matches = [...label.matchAll(/(\d[\d ]*)\s*(кг|г|ц|т)/g)];
      expect(matches.length).toBeGreaterThan(0);
      return matches.reduce((n, m) => n + Number(m[1].replaceAll(' ', '')) * factors[m[2]], 0);
    }
    const tasks = pack.sections![0].topicIds.flatMap((id) => topic(id).tasks);
    for (const t of tasks) {
      if (t.type === 'compare') {
        const delta = grams(t.left) - grams(t.right);
        expect(t.answer, t.id).toBe(delta === 0 ? '=' : delta > 0 ? '>' : '<');
      } else if (t.type === 'order') {
        const sorted = [...t.items]
          .sort((a, b) => grams(a.label) - grams(b.label))
          .map((i) => i.id);
        expect(t.answer, t.id).toEqual(sorted);
      }
    }
    expectNumber('mass-word-problems', 'paper-centner', 100 * 30);
    expectNumber('mass-word-problems', 'paper-tonne', 1000 * 30);
    expectNumber('mass-word-problems', 'wagons-total', (52 + 47) * 8);
    expectNumber('mass-word-problems', 'wagons-difference', (52 - 47) * 8);
    expectNumber('mass-word-problems', 'bread', (8 + 4) * 3 * 5);
    expectNumber('mass-word-problems', 'bags', 100 / 25);
    expectNumber('mass-word-problems', 'remaining', 2 * 1000 - 7 * 100);
  });
  it('checks calendar arithmetic against actual month lengths in the stated year range', () => {
    const days = (year: number, month: number) => new Date(year, month, 0).getDate();
    expect(topic('calendar-leap-year').theory.text).toContain('2000 по 2099');
    expectNumber('calendar-leap-year', 'february-2024', days(2024, 2));
    expectNumber('calendar-leap-year', 'february-2026', days(2026, 2));
    expectNumber('calendar-leap-year', 'next-after-2024', 2024 + 4);
    expectNumber('calendar-leap-year', 'next-after-2028', 2028 + 4);
    const yearDays = (year: number) =>
      Array.from({ length: 12 }, (_, i) => days(year, i + 1)).reduce((a, b) => a + b, 0);
    expectNumber('calendar-leap-year', 'ordinary-days', yearDays(2026));
    expectNumber('calendar-leap-year', 'leap-days', yearDays(2024));
    expectNumber('calendar-leap-year', 'two-years', yearDays(2023) + yearDays(2024));
    expectNumber(
      'calendar-month-length',
      'thirty-months',
      Array.from({ length: 12 }, (_, i) => days(2026, i + 1)).filter((n) => n === 30).length,
    );
    expectNumber(
      'calendar-month-length',
      'thirty-one-months',
      Array.from({ length: 12 }, (_, i) => days(2026, i + 1)).filter((n) => n === 31).length,
    );
    expectNumber('calendar-word-problems', 'summer', days(2026, 6) + days(2026, 7) + days(2026, 8));
    expectNumber('calendar-word-problems', 'rest', days(2026, 6) + days(2026, 7) + 2 * 10 + 7);
    expectNumber('calendar-word-problems', 'feb-march-leap', days(2024, 2) + days(2024, 3));
    for (const [id, years, months] of [
      ['four-years', 4, 0],
      ['two-three', 2, 3],
      ['three-eight', 3, 8],
      ['one-eleven', 1, 11],
      ['five-four', 5, 4],
    ] as const)
      expectNumber('calendar-years-months', id, years * 12 + months);
  });
  it('checks equal-part areas and does not confuse area with side length or perimeter', () => {
    const tasks = topic('area-equal-parts').tasks.filter((t) => t.diagram?.type === 'square-parts');
    expect(tasks).toHaveLength(6);
    for (const t of tasks) {
      if (t.diagram?.type !== 'square-parts') throw new Error('Expected square');
      const side = Number(t.diagram.sideLabel.match(/\d+/)![0]);
      expect(t.answer).toBe(side ** 2 / t.diagram.parts);
      expect((t as Extract<Task, { type: 'number' }>).unit).toBe('см²');
    }
    expectNumber('area-equal-parts', 'square-1', 16);
  });
  it('checks price logic, multi-unit multiplication and a letter-expression substitution', () => {
    const a = [12, 15, 18, 21];
    const b = [8, 10, 12, 14];
    expectNumber(
      'logic-book-prices',
      'a-total',
      a.reduce((n, x) => n + x, 0),
    );
    expectNumber('logic-book-prices', 'a-first', a[0]);
    expectNumber('logic-book-prices', 'a-third', a[2]);
    expectNumber(
      'logic-book-prices',
      'b-total',
      b.reduce((n, x) => n + x, 0),
    );
    expectNumber('logic-book-prices', 'b-second', b[1]);
    expectNumber('logic-book-prices', 'b-fourth', b[3]);
    expectNumber('logic-book-prices', 'three-books', (22 + 26 + 28) / 2);
    expectNumber('letter-expressions-price', 'numeric-difference', 540 / 3 - 600 / 5);
    expectNumber('multiply-quantities', 'mass', 2350 * 3);
    expectNumber('multiply-quantities', 'length', 325 * 4);
    expectNumber('multiply-quantities', 'time', (60 + 20) * 3);
    expectNumber('multiply-quantities', 'centner', 240 * 5);
    expectNumber('multiply-quantities', 'metres', 450 * 6);
    expectNumber('multiply-quantities', 'seconds', (2 * 60 + 15) * 4);
  });
});

describe('quotient and remainder task', () => {
  it('checks both fields, accepts spaced integers and rejects blank, partial and non-integer answers', () => {
    expect(checkAnswer(division, { quotient: '9', remainder: '2' })).toBe(true);
    for (const answer of [
      '9',
      ['9', '2'],
      { quotient: '9', remainder: '' },
      { quotient: '8', remainder: '10' },
      { quotient: '9.5', remainder: '2' },
      { quotient: '9', remainder: '−2' },
    ]) {
      expect(checkAnswer(division, answer), JSON.stringify(answer)).toBe(false);
    }
    const large = task('written-division', '99999-8');
    expect(checkAnswer(large, { quotient: '12 499', remainder: '7' })).toBe(true);
    expect(answerLabel(division)).toBe('9 (ост. 2)');
  });
  it('supports zero quotient and zero remainder', () => {
    expect(
      checkAnswer(task('division-remainder', 'divide-5-9'), { quotient: '0', remainder: '5' }),
    ).toBe(true);
    expect(
      checkAnswer(task('division-remainder', 'divide-80-8'), { quotient: '10', remainder: '0' }),
    ).toBe(true);
    const zero = taskSchema.parse({
      ...division,
      dividend: 0,
      answer: { quotient: 0, remainder: 0 },
    });
    expect(checkAnswer(zero, { quotient: '0', remainder: '0' })).toBe(true);
  });
  it('validates every division mathematically, not just structurally', () => {
    const divisions = newTopics.flatMap((t) => t.tasks).filter((t) => t.type === 'division');
    expect(divisions).toHaveLength(15);
    for (const t of divisions) {
      expect(t.answer.quotient).toBe(Math.floor(t.dividend / t.divisor));
      expect(t.answer.remainder).toBe(t.dividend % t.divisor);
    }
  });
  it.each([
    { answer: { quotient: 8, remainder: 10 } },
    { answer: { quotient: 10, remainder: 2 } },
    { answer: { quotient: -1, remainder: 82 } },
    { answer: { quotient: 9.25, remainder: 0 } },
    { divisor: 0 },
    { dividend: -1 },
  ])('rejects invalid authored division %j', (change) => {
    expect(taskSchema.safeParse({ ...division, ...change }).success).toBe(false);
  });
  it('persists two-field feedback, the hint and retry, then records recovery once', () => {
    const one = { ...topic('division-remainder'), lessonSize: 1, tasks: [division] };
    const session = submitAnswer(
      { ...createSession(one, 4), hintOpen: true },
      { quotient: '8', remainder: '10' },
    );
    const data = createAppData();
    data.profiles[0].activeSession = session;
    expect(writeData(data, localStorage)).toBe(true);
    const restored = readData(localStorage).data;
    expect(restored.profiles[0].activeSession).toEqual(session);
    const retry = nextTask(restored.profiles[0].activeSession!)!;
    const corrected = submitAnswer(retry, { quotient: '9', remainder: '2' });
    expect(nextTask(corrected)).toBeNull();
    const result = finishSession(createProfile(), corrected, '2026-11-02');
    expect(result.result).toMatchObject({ total: 1, correct: 0, assisted: 1, recovered: 1 });
    expect(result.profile.topics['4:division-remainder'].level).toBe(0);
    data.profiles[0] = result.profile;
    data.activeProfileId = result.profile.id;
    expect(appDataSchema.safeParse(data).success).toBe(true);
  });
});
