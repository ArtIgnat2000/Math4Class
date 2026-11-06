import { describe, expect, it } from 'vitest';
import { BUILTIN_PACKS, getPack } from '../src/content';
import {
  approvedTaskIds,
  authorApprovedTaskIds,
  isAuthorTask,
  taskApproved,
} from '../src/content/approved';

describe('approved textbook exercise gate', () => {
  it('releases 23 checked textbook exercises and 3 separately approved author ones', () => {
    const pack = getPack(4, []);
    expect(pack.topics).toHaveLength(7);
    expect(pack.topics.reduce((sum, topic) => sum + topic.tasks.length, 0)).toBe(26);
    const textbook = pack.topics.filter((topic) => !authorApprovedTaskIds[topic.id]);
    const author = pack.topics.filter((topic) => authorApprovedTaskIds[topic.id]);
    expect(textbook.reduce((sum, topic) => sum + topic.tasks.length, 0)).toBe(23);
    expect(author.map((topic) => topic.id)).toEqual(['roman-numerals']);
    expect(author[0].tasks).toHaveLength(3);
    for (const topic of textbook) {
      expect(topic.reference?.kind).toBe('page');
      expect(topic.reference?.pages).toContain(approvedTaskIds[topic.id].page);
      for (const task of topic.tasks) {
        expect(taskApproved(4, topic.id, task)).toBe(true);
        expect(isAuthorTask(topic.id, task.id)).toBe(false);
      }
    }
    // An author's addition carries no page and is never labelled as the textbook's.
    expect(author[0].reference).toBeUndefined();
    for (const task of author[0].tasks) {
      expect(taskApproved(4, author[0].id, task)).toBe(true);
      expect(isAuthorTask(author[0].id, task.id)).toBe(true);
      expect(approvedTaskIds[author[0].id]).toBeUndefined();
    }
    expect(authorApprovedTaskIds['roman-numerals'].approvedOn).toBe('2026-11-06');
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
