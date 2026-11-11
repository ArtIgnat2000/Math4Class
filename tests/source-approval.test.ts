import { describe, expect, it } from 'vitest';
import { BUILTIN_PACKS, getPack } from '../src/content';
import {
  approvedTaskIds,
  authorApprovedTaskIds,
  isAuthorTask,
  taskApproved,
} from '../src/content/approved';

describe('approved textbook exercise gate', () => {
  it('releases checked textbook tasks alongside explicitly approved authored practice', () => {
    const pack = getPack(4, []);
    expect(pack.topics).toHaveLength(10);
    expect(pack.topics.reduce((sum, topic) => sum + topic.tasks.length, 0)).toBe(40);
    const tasks = pack.topics.flatMap((topic) => topic.tasks.map((task) => ({ topic, task })));
    expect(tasks.filter(({ topic, task }) => !isAuthorTask(topic.id, task.id))).toHaveLength(32);
    expect(tasks.filter(({ topic, task }) => isAuthorTask(topic.id, task.id))).toHaveLength(8);
    for (const { topic, task } of tasks) {
      expect(taskApproved(4, topic.id, task)).toBe(true);
      if (!isAuthorTask(topic.id, task.id)) {
        expect(topic.reference?.kind).toBe('page');
        expect(topic.reference?.pages).toContain(approvedTaskIds[topic.id].page);
      }
    }
    const roman = pack.topics.find((topic) => topic.id === 'roman-numerals')!;
    expect(roman.reference).toBeUndefined();
    expect(roman.tasks).toHaveLength(3);
    for (const task of roman.tasks) expect(isAuthorTask(roman.id, task.id)).toBe(true);
    expect(authorApprovedTaskIds['roman-numerals'].approvedOn).toBe('2026-11-06');
    expect(authorApprovedTaskIds['time-units-table'].approvedOn).toBe('2026-11-11');
    for (const grade of [1, 2, 3] as const) expect(getPack(grade, []).topics).toHaveLength(0);
    expect(
      getPack(4, [{ ...BUILTIN_PACKS[4], topics: [BUILTIN_PACKS[4].topics[0]] }]).topics,
    ).toHaveLength(0);
  });
  it('rejects authored variations and changes to a once approved exercise', () => {
    const pack = BUILTIN_PACKS[4];
    const topic = pack.topics.find((t) => t.id === 'equations-add-subtract')!;
    const task = topic.tasks[0];
    expect(taskApproved(4, topic.id, task)).toBe(true);
    expect(
      taskApproved(4, topic.id, { ...task, question: `${task.question} Ещё одно условие.` }),
    ).toBe(false);
    expect(taskApproved(4, topic.id, { ...task, id: 'inspired-by-219' })).toBe(false);
    // The author gate closes on an edited condition or answer just like the textbook one.
    const roman = pack.topics.find((t) => t.id === 'roman-numerals')!;
    const romanTask = roman.tasks[0];
    expect(taskApproved(4, roman.id, romanTask)).toBe(true);
    expect(taskApproved(4, roman.id, { ...romanTask, question: 'Какой месяц обозначен V?' })).toBe(
      false,
    );
    expect(taskApproved(4, roman.id, { ...romanTask, answer: 'b' } as typeof romanTask)).toBe(
      false,
    );
    expect(taskApproved(4, roman.id, { ...romanTask, id: 'roman-five' })).toBe(false);
    expect(
      taskApproved(
        4,
        'calendar-months',
        pack.topics.find((t) => t.id === 'calendar-months')!.tasks[0],
      ),
    ).toBe(false);
  });
});
