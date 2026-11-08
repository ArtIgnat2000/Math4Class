import { describe, expect, it } from 'vitest';
import { BUILTIN_PACKS } from '../src/content';
import { parsePack, type Task } from '../src/engine/content';
import { answerLabel, checkAnswer, initialOrder, parseNumericAnswer } from '../src/engine/answers';
import {
  appDataSchema,
  createAppData,
  createProfile,
  sessionSchema,
  type Answer,
  type Session,
} from '../src/engine/model';
import {
  createSession,
  finishSession,
  nextTask,
  sessionResult,
  submitAnswer,
} from '../src/engine/lesson';
import { addDays, dayKey, plural } from '../src/engine/dates';
import {
  badgeValues,
  dueTopics,
  gradeStats,
  recommendedTopic,
  streak,
  topicKey,
  untriedTopics,
} from '../src/engine/progress';
const pack = BUILTIN_PACKS[4];
const topic = pack.topics.find((t) => t.id === 'large-numbers')!;
const fixturePack = { ...pack, sections: undefined };
const today = '2026-11-02';
function solve(session: Session, wrongFirst = false): Session {
  let current = session;
  while (true) {
    const entry = current.entries[current.cursor];
    const answer = wrongFirst && current.cursor === 0 ? 'definitely-wrong' : canonical(entry.task);
    current = submitAnswer(current, answer);
    const next = nextTask(current);
    if (!next) return current;
    current = next;
  }
}
function canonical(task: Task): Answer {
  return task.type === 'number'
    ? String(task.answer)
    : task.type === 'division'
      ? { quotient: String(task.answer.quotient), remainder: String(task.answer.remainder) }
      : task.answer;
}

describe('mass story opening', () => {
  it('always opens new learning sessions with three 1 kg weights', () => {
    const mass = pack.topics.find((t) => t.id === 'mass-kg-g')!;
    for (const random of [() => 0, () => 0.5, () => 0.99]) {
      const lesson = createSession(mass, 4, 'learn', [], random);
      expect(lesson.entries[0].task.id).toBe('kg-3');
      expect(new Set(lesson.entries.map((entry) => entry.task.id)).size).toBe(
        lesson.entries.length,
      );
    }
  });
});

describe('content contract', () => {
  it('validates all 46 topics and their 310 tasks', () => {
    const packs = Object.values(BUILTIN_PACKS);
    expect(packs.reduce((n, p) => n + p.topics.length, 0)).toBe(46);
    expect(packs.reduce((n, p) => n + p.topics.reduce((s, t) => s + t.tasks.length, 0), 0)).toBe(
      310,
    );
    for (const pack of packs)
      for (const t of pack.topics)
        for (const task of t.tasks) {
          expect(checkAnswer(task, canonical(task)), `${pack.grade}/${t.id}/${task.id}`).toBe(true);
          expect(answerLabel(task)).not.toBe('');
        }
  });
  it('rejects duplicate topics and task IDs', () => {
    expect(() => parsePack({ ...fixturePack, topics: [topic, topic] })).toThrow();
    expect(() =>
      parsePack({
        ...fixturePack,
        topics: [{ ...topic, tasks: [topic.tasks[0], topic.tasks[0]] }],
      }),
    ).toThrow();
  });
  it('rejects a missing choice answer and duplicate order items', () => {
    const choice = topic.tasks.find((t) => t.type === 'choice')!;
    expect(() =>
      parsePack({
        ...fixturePack,
        topics: [{ ...topic, tasks: [{ ...choice, answer: 'not-there' }] }],
      }),
    ).toThrow();
    const order = topic.tasks.find((t) => t.type === 'order')!;
    expect(() =>
      parsePack({
        ...fixturePack,
        topics: [{ ...topic, tasks: [{ ...order, answer: ['i1', 'i1', 'i2', 'i3'] }] }],
      }),
    ).toThrow();
  });
  it('rejects unknown fields, grades and impossible diagrams', () => {
    expect(() => parsePack({ ...fixturePack, grade: 5 })).toThrow();
    expect(() => parsePack({ ...fixturePack, runCode: 'alert(1)' })).toThrow();
    expect(() =>
      parsePack({
        ...fixturePack,
        topics: [
          {
            ...topic,
            tasks: [{ ...topic.tasks[0], diagram: { type: 'fraction', parts: 3, shaded: 4 } }],
          },
        ],
      }),
    ).toThrow();
  });
});
describe('answers', () => {
  it.each([
    ['12 000', 12000],
    ['12\u202f000', 12000],
    [' 1,5 ', 1.5],
    ['−7', -7],
    ['.5', 0.5],
    ['0', 0],
  ])('accepts %s as %s', (value, expected) => expect(parseNumericAnswer(value)).toBe(expected));
  it.each(['', '  ', '1+2', 'Infinity', 'NaN', '2e3', '3 см', '--3', '1,2.3'])(
    'rejects non-number %s',
    (value) => expect(parseNumericAnswer(value)).toBeNull(),
  );
  it('uses numeric equivalence, not string equality or eval', () => {
    const task = { ...topic.tasks[0], type: 'number', answer: 12000 } as Task;
    expect(checkAnswer(task, '12 000')).toBe(true);
    expect(checkAnswer(task, '12e3')).toBe(false);
    expect(checkAnswer(task, ['12000'])).toBe(false);
  });
  it('always presents an initially unsolved order', () => {
    const task = topic.tasks.find((t) => t.type === 'order')!;
    if (task.type !== 'order') throw new Error();
    for (const random of [() => 0, () => 0.999]) {
      const order = initialOrder(task, random);
      expect(order).not.toEqual(task.answer);
      expect([...order].sort()).toEqual([...task.answer].sort());
    }
  });
});
describe('lesson state machine', () => {
  it('creates a unique, bounded queue and validates its snapshot', () => {
    const session = createSession(topic, 4);
    expect(new Set(session.entries.map((e) => e.task.id)).size).toBe(5);
    expect(sessionSchema.safeParse(session).success).toBe(true);
    expect(createSession({ ...topic, lessonSize: 10 }, 4).entries).toHaveLength(5);
  });
  it('prioritizes mistakes for review', () => {
    const session = createSession({ ...topic, lessonSize: 2 }, 4, 'review', ['expanded']);
    expect(session.entries[0].task.id).toBe('expanded');
  });
  it('requires feedback before advancing and does not submit twice', () => {
    const session = createSession(topic, 4);
    expect(nextTask(session)).toBe(session);
    const checked = submitAnswer(session, canonical(session.entries[0].task));
    expect(submitAnswer(checked, 'bad')).toBe(checked);
    expect(session.attempts).toHaveLength(0);
  });
  it('requeues an error once and never loops infinitely', () => {
    let session = createSession({ ...topic, tasks: [topic.tasks[0]] }, 4);
    session = submitAnswer(session, 'wrong');
    expect(session.entries).toHaveLength(2);
    session = nextTask(session)!;
    session = submitAnswer(session, 'still-wrong');
    expect(session.entries).toHaveLength(2);
    expect(nextTask(session)).toBeNull();
    expect(sessionSchema.safeParse(session).success).toBe(true);
  });
  it('records hint use without awarding independent mastery', () => {
    const session = solve({ ...createSession(topic, 4), hintOpen: true });
    const result = sessionResult(session, today);
    expect(result.assisted).toBe(1);
    expect(result.stars).toBe(2);
    expect(result.xp).toBe(45);
  });
  it('requires a completed queue and only commits a session once', () => {
    const p = createProfile();
    expect(() => finishSession(p, createSession(topic, 4), today)).toThrow();
    const session = solve(createSession(topic, 4));
    const first = finishSession(p, session, today);
    const second = finishSession(first.profile, session, today);
    expect(second.profile).toBe(first.profile);
    expect(second.profile.totals.lessons).toBe(1);
    expect(second.profile.totals.xp).toBe(50);
    expect(
      appDataSchema.safeParse({
        ...createAppData(),
        activeProfileId: p.id,
        profiles: [second.profile],
      }).success,
    ).toBe(true);
  });
  it('keeps first-attempt accuracy and separately rewards recovery', () => {
    const session = solve(createSession(topic, 4), true);
    const { profile: p, result } = finishSession(createProfile(), session, today);
    expect(result).toMatchObject({ correct: 4, total: 5, recovered: 1, xp: 47, stars: 2 });
    expect(p.daily[today].tasks).toBe(5);
    expect(p.topics[topicKey(4, topic.id)].mistakeIds).toHaveLength(1);
  });
  it('advances at most once per day, spaces reviews at 1, 3 and 7 days', () => {
    const key = topicKey(4, topic.id);
    let p = finishSession(createProfile(), solve(createSession(topic, 4)), today).profile;
    expect(p.topics[key]).toMatchObject({ level: 1, dueDay: '2026-11-03' });
    p = finishSession(p, solve(createSession(topic, 4)), today).profile;
    expect(p.topics[key].level).toBe(1);
    p = finishSession(p, solve(createSession(topic, 4)), '2026-11-03').profile;
    expect(p.topics[key]).toMatchObject({ level: 2, dueDay: '2026-11-06' });
    p = finishSession(p, solve(createSession(topic, 4)), '2026-11-06').profile;
    expect(p.topics[key]).toMatchObject({ level: 3, dueDay: '2026-11-13' });
    expect(gradeStats(p, BUILTIN_PACKS[4]).mastered).toBe(1);
  });
  it('separates progress between classes and profiles', () => {
    const p = finishSession(createProfile(), solve(createSession(topic, 4)), today).profile;
    expect(p.topics[topicKey(1, topic.id)]).toBeUndefined();
    expect(createProfile().totals.lessons).toBe(0);
  });
});
describe('recommendations and calendars', () => {
  it('prioritizes untried topics even when review is due', () => {
    const fresh = createProfile();
    const first = pack.topics[0];
    expect(recommendedTopic(fresh, pack, today)).toMatchObject({ topic: first, review: false });
    const p = finishSession(fresh, solve(createSession(first, 4)), today).profile;
    expect(dueTopics(p, BUILTIN_PACKS[4], today)).toHaveLength(0);
    expect(recommendedTopic(p, pack, today).topic?.id).toBe(pack.topics[1].id);
    expect(dueTopics(p, BUILTIN_PACKS[4], '2026-11-03').map((t) => t.id)).toContain(first.id);
    expect(recommendedTopic(p, pack, '2026-11-03')).toMatchObject({
      topic: pack.topics[1],
      review: false,
    });
  });
  it('finds the next untried visible topic after the current one, wraps, and handles exhausted packs', () => {
    const smallPack = { ...pack, topics: pack.topics.slice(0, 3) };
    let profile = createProfile();
    profile = finishSession(profile, solve(createSession(smallPack.topics[1], 4)), today).profile;
    expect(untriedTopics(profile, smallPack, smallPack.topics[1].id).map((t) => t.id)).toEqual([
      smallPack.topics[2].id,
      smallPack.topics[0].id,
    ]);
    expect(untriedTopics(profile, smallPack, 'removed-topic')[0].id).toBe(smallPack.topics[0].id);
    profile = finishSession(profile, solve(createSession(smallPack.topics[2], 4)), today).profile;
    profile = finishSession(profile, solve(createSession(smallPack.topics[0], 4)), today).profile;
    expect(untriedTopics(profile, smallPack, smallPack.topics[0].id)).toEqual([]);
    expect(recommendedTopic(profile, smallPack, today).review).toBe(true);
    expect(recommendedTopic(profile, { ...smallPack, topics: [] }, today)).toEqual({
      topic: null,
      review: false,
    });
    expect(untriedTopics(profile, { ...smallPack, grade: 3 }, smallPack.topics[0].id)).toHaveLength(
      3,
    );
  });
  it('preserves the streak before today’s lesson and ends it after a missed day', () => {
    let p = finishSession(createProfile(), solve(createSession(topic, 4)), today).profile;
    p = finishSession(p, solve(createSession(topic, 4)), '2026-11-03').profile;
    expect(streak(p, '2026-11-03')).toBe(2);
    expect(streak(p, '2026-11-04')).toBe(2);
    expect(streak(p, '2026-11-05')).toBe(0);
    expect(badgeValues(p, today).first).toBe(2);
  });
  it('retains the week badge after a break', () => {
    let p = createProfile();
    for (let i = 0; i < 7; i++)
      p = finishSession(p, solve(createSession(topic, 4)), addDays(today, i)).profile;
    expect(badgeValues(p, '2026-11-20').week).toBe(7);
  });
  it('uses local days, leap years and Russian plurals', () => {
    expect(dayKey(new Date(2026, 10, 2, 0, 1))).toBe(today);
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect([1, 2, 5, 11, 21].map((n) => plural(n, ['день', 'дня', 'дней']))).toEqual([
      'день',
      'дня',
      'дней',
      'дней',
      'день',
    ]);
  });
});
