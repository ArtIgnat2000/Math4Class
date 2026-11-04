import { describe, expect, it } from 'vitest';
import { BUILTIN_PACKS, getPack } from '../src/content';
import { approvedTaskIds, taskApproved } from '../src/content/approved';

describe('approved textbook exercise gate', () => {
  it('only releases the 23 directly checked exercises on photographed pages', () => {
    const pack = getPack(4, []);
    expect(pack.topics).toHaveLength(6);
    expect(pack.topics.reduce((sum, topic) => sum + topic.tasks.length, 0)).toBe(23);
    for (const topic of pack.topics) {
      expect(topic.reference?.kind).toBe('page');
      expect(topic.reference?.pages).toContain(approvedTaskIds[topic.id].page);
      for (const task of topic.tasks) expect(taskApproved(4, topic.id, task)).toBe(true);
    }
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
    expect(
      taskApproved(
        4,
        'calendar-months',
        pack.topics.find((t) => t.id === 'calendar-months')!.tasks[0],
      ),
    ).toBe(false);
  });
});
