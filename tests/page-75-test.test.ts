import { describe, expect, it } from 'vitest';
import { getPack } from '../src/content';
import { isAuthorTask, taskApproved } from '../src/content/approved';
import { checkAnswer } from '../src/engine/answers';
import { parseColumnChoice } from '../src/engine/column-choice';
import type { Answer } from '../src/engine/model';
import type { Task } from '../src/engine/content';
import { createSession, finishSession, nextTask, submitAnswer } from '../src/engine/lesson';
import { createAppData } from '../src/engine/model';
import { isPrintedTest } from '../src/engine/progress';

const topic = getPack(4, []).topics.find((item) => item.id === 'page-75-test')!;
const task = (id: string) => topic.tasks.find((item) => item.id === id)!;

/** Thousands in the textbook use a plain space; keep the check independent of it. */
const show = (value: number) => String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const choice = (id: string) => task(id) as Extract<Task, { type: 'choice' }>;
const chosenLabel = (id: string) =>
  choice(id)
    .options.find((option) => option.id === choice(id).answer)!
    .label.replace(/\s/g, ' ');
const answerOf = (item: Task): Answer =>
  item.type === 'number'
    ? String(item.answer)
    : item.type === 'division'
      ? { quotient: String(item.answer.quotient), remainder: String(item.answer.remainder) }
      : item.answer;

describe('page 75 test, variant 2', () => {
  it('is the printed second variant of ten numbered questions, not an author addition', () => {
    expect(topic.title).toBe('Проверим себя · вариант 2');
    expect(topic.reference).toEqual({ kind: 'page', pages: [75] });
    expect(topic.lessonSize).toBe(10);
    expect(topic.tasks).toHaveLength(10);
    for (const [index, item] of topic.tasks.entries()) {
      // Printed numbers 1–10 are shown on the card, exactly as in the textbook table.
      expect(item.sourceNumber, item.id).toBe(index + 1);
      expect(['choice', 'compare']).toContain(item.type);
      if (item.type === 'choice') {
        expect(item.options.length).toBeGreaterThanOrEqual(2);
        expect(item.options.length).toBeLessThanOrEqual(3);
      }
      expect(isAuthorTask(topic.id, item.id)).toBe(false);
      expect(taskApproved(4, topic.id, item)).toBe(true);
    }
  });

  it('shares the printed-test behaviour of variant 1 instead of a new code branch', () => {
    expect(isPrintedTest('page-75-test')).toBe(true);
    expect(isPrintedTest('page-74-test')).toBe(true);
    // Ordinary practice sets keep their shuffled order and their own start sheet.
    expect(isPrintedTest('division-remainder')).toBe(false);
    expect(isPrintedTest('calendar-years-months')).toBe(false);
  });

  it('keeps the printed order of questions 1–10 instead of shuffling the test', () => {
    const session = createSession(topic, 4);
    expect(session.topicId).toBe('page-75-test');
    expect(session.initialCount).toBe(10);
    expect(session.entries.map((entry) => entry.task.id)).toEqual(
      topic.tasks.map((item) => item.id),
    );
    expect(session.entries.map((entry) => entry.task.sourceNumber)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    ]);
  });

  it('closes the gate as soon as a condition, a variant or an answer is edited', () => {
    const first = topic.tasks[0];
    expect(taskApproved(4, topic.id, { ...first, answer: 'c' } as Task)).toBe(false);
    expect(
      taskApproved(4, topic.id, { ...first, question: `${first.question} Ещё одно условие.` }),
    ).toBe(false);
    expect(taskApproved(4, topic.id, { ...first, id: 'v2-eleven' })).toBe(false);
    const compare = task('v2-5');
    expect(taskApproved(4, topic.id, { ...compare, answer: '>' } as Task)).toBe(false);
    expect(taskApproved(4, topic.id, { ...compare, left: '5 600' } as Task)).toBe(false);
    expect(taskApproved(4, topic.id, { ...compare, right: '5 600' } as Task)).toBe(false);
  });

  it('recomputes every printed answer independently of the stored option ids', () => {
    expect(chosenLabel('v2-1')).toBe(show(4_000 - 2_400));
    expect(chosenLabel('v2-2')).toBe(show(900 + 300));

    const expressions: [string, number][] = [
      ['1 400 + 20', 1_400 + 20],
      ['1 700 − 1 000', 1_700 - 1_000],
      ['2 300 − 700', 2_300 - 700],
    ];
    expect(chosenLabel('v2-3')).toBe('2 300 − 700');
    expect(expressions.find(([text]) => text === chosenLabel('v2-3'))![1]).toBe(1_600);
    expect(expressions.filter(([, value]) => value === 1_600)).toHaveLength(1);

    expect(chosenLabel('v2-4')).toBe(show((980 - 350) / 9 + 100));

    const compare = task('v2-5');
    if (compare.type !== 'compare') throw new Error('Expected a comparison task');
    expect(compare.left).toBe('5 600 − (300 + 600)');
    expect(compare.right).toBe('5 600 − 300 + 600');
    expect(compare.answer).toBe(5_600 - (300 + 600) < 5_600 - 300 + 600 ? '<' : '>');

    expect(chosenLabel('v2-6')).toBe('18 : 2 · 6');
    expect((18 / 2) * 6).toBe(54);
    expect((18 + 2) * 6).not.toBe(54);
    expect(18 / 2 / 6).not.toBe(54);

    expect(chosenLabel('v2-7')).toBe(`38 697 + 42 538 = ${show(38_697 + 42_538)}`);
    expect(chosenLabel('v2-8')).toBe(`81 423 − 29 873 = ${show(81_423 - 29_873)}`);
    expect(chosenLabel('v2-9')).toBe(show(10_250 - 250 - 9_400));
    expect(chosenLabel('v2-10')).toBe('3 кг');
  });

  it('prints tasks 7–8 as columns and keeps the textbook distractor', () => {
    const seventh = choice('v2-7');
    expect(seventh.options.map((option) => parseColumnChoice(option.label))).toEqual([
      { operator: '+', top: '38697', bottom: '42538', result: '81135' },
      { operator: '+', top: '38697', bottom: '42538', result: '81235' },
    ]);
    const eighth = choice('v2-8');
    expect(eighth.options.map((option) => parseColumnChoice(option.label))).toEqual([
      { operator: '−', top: '81423', bottom: '29873', result: '51540' },
      { operator: '−', top: '81423', bottom: '29873', result: '51550' },
    ]);
    // No other printed option is a written calculation, so it stays a plain line.
    for (const item of topic.tasks) {
      if (item.type !== 'choice' || ['v2-7', 'v2-8'].includes(item.id)) continue;
      for (const option of item.options) expect(parseColumnChoice(option.label)).toBeNull();
    }
  });

  it('checks the chosen option, not its position, and accepts only the printed answer', () => {
    for (const item of topic.tasks) {
      if (item.type === 'compare') {
        expect(checkAnswer(item, '<')).toBe(true);
        expect(checkAnswer(item, '>')).toBe(false);
        continue;
      }
      if (item.type !== 'choice') throw new Error('Expected a choice task');
      expect(checkAnswer(item, item.answer)).toBe(true);
      for (const option of item.options) {
        expect(checkAnswer(item, option.id), `${item.id}/${option.id}`).toBe(
          option.id === item.answer,
        );
      }
    }
  });

  it('completes all ten questions and records one ordinary lesson', () => {
    let session = createSession(topic, 4);
    while (true) {
      session = submitAnswer(session, answerOf(session.entries[session.cursor].task as Task));
      const next = nextTask(session);
      if (!next) break;
      session = next;
    }
    expect(session.attempts).toHaveLength(10);
    expect(session.attempts.every((attempt) => attempt.correct && !attempt.retry)).toBe(true);
    const { profile, result } = finishSession(createAppData().profiles[0], session);
    expect(result.topicTitle).toBe('Проверим себя · вариант 2');
    expect(result.total).toBe(10);
    expect(result.correct).toBe(10);
    expect(result.stars).toBe(3);
    expect(profile.topics['4:page-75-test']).toMatchObject({
      sessions: 1,
      correct: 10,
      total: 10,
      bestStars: 3,
    });
    expect(profile.history.at(-1)?.topicId).toBe('page-75-test');
  });

  it('keeps the two variants independent in progress', () => {
    const first = createSession(
      getPack(4, []).topics.find((item) => item.id === 'page-74-test')!,
      4,
    );
    let session = first;
    while (true) {
      session = submitAnswer(session, answerOf(session.entries[session.cursor].task as Task));
      const next = nextTask(session);
      if (!next) break;
      session = next;
    }
    const { profile } = finishSession(createAppData().profiles[0], session);
    expect(profile.topics['4:page-74-test']?.sessions).toBe(1);
    expect(profile.topics['4:page-75-test']).toBeUndefined();
  });
});
