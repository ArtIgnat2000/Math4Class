import { describe, expect, it } from 'vitest';
import { getPack } from '../src/content';
import { isAuthorTask, taskApproved } from '../src/content/approved';
import { checkAnswer } from '../src/engine/answers';
import { parseColumnChoice } from '../src/engine/column-choice';
import type { Answer } from '../src/engine/model';
import type { Task } from '../src/engine/content';
import { createSession, finishSession, nextTask, submitAnswer } from '../src/engine/lesson';
import { createAppData } from '../src/engine/model';

const topic = getPack(4, []).topics.find((item) => item.id === 'page-74-test')!;
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

describe('page 74 test', () => {
  it('is a checked textbook topic of ten printed questions, not an author addition', () => {
    expect(topic.title).toBe('Проверим себя');
    expect(topic.reference).toEqual({ kind: 'page', pages: [74] });
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

  it('keeps the printed order of questions 1–10 instead of shuffling the test', () => {
    const session = createSession(topic, 4);
    expect(session.topicId).toBe('page-74-test');
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
    expect(taskApproved(4, topic.id, { ...first, answer: 'a' } as Task)).toBe(false);
    expect(
      taskApproved(4, topic.id, { ...first, question: `${first.question} Ещё одно условие.` }),
    ).toBe(false);
    expect(taskApproved(4, topic.id, { ...first, id: 'test-eleven' })).toBe(false);
    const compare = task('test-5');
    expect(taskApproved(4, topic.id, { ...compare, answer: '<' } as Task)).toBe(false);
    expect(taskApproved(4, topic.id, { ...compare, left: '3 800' } as Task)).toBe(false);
  });

  it('recomputes every printed answer independently of the stored option ids', () => {
    expect(chosenLabel('test-1')).toBe(show(6_000 - 5_300));
    expect(chosenLabel('test-2')).toBe(show(700 + 800));

    const expressions: [string, number][] = [
      ['2 600 + 20', 2_600 + 20],
      ['3 000 − 200', 3_000 - 200],
      ['2 700 + 1 000', 2_700 + 1_000],
    ];
    expect(chosenLabel('test-3')).toBe('3 000 − 200');
    expect(expressions.find(([text]) => text === chosenLabel('test-3'))![1]).toBe(2_800);
    expect(expressions.filter(([, value]) => value === 2_800)).toHaveLength(1);

    expect(chosenLabel('test-4')).toBe(show((600 + 240) / 7 + 80));

    const compare = task('test-5');
    if (compare.type !== 'compare') throw new Error('Expected a comparison task');
    expect(compare.left).toBe('3 800 − (1 900 − 900)');
    expect(compare.right).toBe('3 800 − 1 900');
    expect(compare.answer).toBe(3_800 - (1_900 - 900) > 3_800 - 1_900 ? '>' : '<');

    expect(chosenLabel('test-6')).toBe('15 − 3 · 2');
    expect(15 - 3 * 2).toBe(9);
    expect((15 - 3) * 2).not.toBe(9);
    expect(15 - (3 + 2)).not.toBe(9);

    expect(chosenLabel('test-7')).toBe(`48 679 + 32 976 = ${show(48_679 + 32_976)}`);
    expect(chosenLabel('test-8')).toBe(`72 435 − 25 796 = ${show(72_435 - 25_796)}`);
    expect(chosenLabel('test-9')).toBe(show(10_000 - 1_000 - 8_200));
    expect(chosenLabel('test-10')).toBe('19 см');
  });

  it('prints tasks 7–8 as columns and keeps the distractors from the book', () => {
    const seventh = choice('test-7');
    const layouts = seventh.options.map((option) => parseColumnChoice(option.label));
    expect(layouts).toEqual([
      { operator: '+', top: '48679', bottom: '32976', result: '80655' },
      { operator: '+', top: '48679', bottom: '32976', result: '81655' },
    ]);
    const eighth = choice('test-8');
    expect(eighth.options.map((option) => parseColumnChoice(option.label))).toEqual([
      { operator: '−', top: '72435', bottom: '25796', result: '56649' },
      { operator: '−', top: '72435', bottom: '25796', result: '46639' },
    ]);
    // No other printed option is a written calculation, so it stays a plain line.
    for (const item of topic.tasks) {
      if (item.type !== 'choice' || ['test-7', 'test-8'].includes(item.id)) continue;
      for (const option of item.options) expect(parseColumnChoice(option.label)).toBeNull();
    }
  });

  it('checks the chosen option, not its position, and accepts only the printed answer', () => {
    for (const item of topic.tasks) {
      if (item.type === 'compare') {
        expect(checkAnswer(item, '>')).toBe(true);
        expect(checkAnswer(item, '<')).toBe(false);
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
    expect(result.topicTitle).toBe('Проверим себя');
    expect(result.total).toBe(10);
    expect(result.correct).toBe(10);
    expect(result.stars).toBe(3);
    expect(profile.topics['4:page-74-test']).toMatchObject({
      sessions: 1,
      correct: 10,
      total: 10,
      bestStars: 3,
    });
    expect(profile.history.at(-1)?.topicId).toBe('page-74-test');
  });
});
