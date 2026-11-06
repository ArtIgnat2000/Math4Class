import { describe, expect, it } from 'vitest';
import {
  commitBoard,
  dropIndexAt,
  insertSign,
  insideBoard,
  moveSign,
  removeSign,
} from '../src/engine/roman-board';
import type { RomanSign } from '../src/engine/roman';

const signs = (text: string) => [...text] as RomanSign[];

describe('roman board editing', () => {
  it('inserts a sign at the place the child dropped it, not only at the end', () => {
    expect(insertSign(signs('V'), 'I', 0).signs.join('')).toBe('IV');
    expect(insertSign(signs('V'), 'I', 1).signs.join('')).toBe('VI');
    expect(insertSign(signs('XV'), 'I', 1).signs.join('')).toBe('XIV');
    // An index past the end simply appends.
    expect(insertSign(signs('X'), 'I', 9).signs.join('')).toBe('XI');
    expect(insertSign([], 'I', -3).signs.join('')).toBe('I');
  });

  it('refuses an insert that breaks a rule and keeps the board untouched', () => {
    const board = signs('III');
    const result = insertSign(board, 'I', 2);
    expect(result.signs.join('')).toBe('III');
    expect(result.refusal).toContain('Четыре I подряд не пишут');
    expect(result.value).toBe(3);
  });

  it('moves a placed sign and explains that the position changes the number', () => {
    const moved = moveSign(signs('VI'), 1, 0);
    expect(moved.signs.join('')).toBe('IV');
    expect(moved.value).toBe(4);
    expect(moved.refusal).toBeNull();
    expect(moveSign(signs('IV'), 0, 1).signs.join('')).toBe('VI');
    expect(moveSign(signs('XIV'), 1, 2).signs.join('')).toBe('XVI');
  });

  it('refuses a move that leaves the lesson range and keeps the old order', () => {
    const board = signs('XIX');
    const result = moveSign(board, 2, 0);
    expect(result.signs.join('')).toBe('XIX');
    expect(result.refusal).toContain('Пока считаем до XX');
  });

  it('ignores a move of a sign that is not on the board', () => {
    expect(moveSign(signs('IV'), 5, 0).signs.join('')).toBe('IV');
    expect(moveSign([], 0, 0).signs.join('')).toBe('');
  });

  it('takes any sign back out, including the middle one, down to an empty board', () => {
    expect(removeSign(signs('XIV'), 1).signs.join('')).toBe('XV');
    expect(removeSign(signs('XIV'), 0).signs.join('')).toBe('IV');
    expect(removeSign(signs('I'), 0).signs).toEqual([]);
    expect(removeSign(signs('I'), 0).value).toBeNull();
    // Taking away is always allowed: the child must never lose a sign.
    expect(removeSign(signs('IV'), 9).signs.join('')).toBe('IV');
  });

  it('treats an empty board as a start, not as an error', () => {
    expect(commitBoard(signs('I'), []).refusal).toBeNull();
    expect(commitBoard([], []).issue).toBe('empty');
  });

  it('finds the gap under the pointer and knows when the pointer left the board', () => {
    const boxes = [
      { left: 0, width: 40 },
      { left: 50, width: 40 },
    ];
    expect(dropIndexAt(-10, boxes)).toBe(0);
    expect(dropIndexAt(10, boxes)).toBe(0);
    expect(dropIndexAt(30, boxes)).toBe(1);
    expect(dropIndexAt(120, boxes)).toBe(2);
    expect(dropIndexAt(10, [])).toBe(0);

    const rect = { left: 0, top: 0, width: 300, height: 80 };
    expect(insideBoard(150, 40, rect)).toBe(true);
    expect(insideBoard(305, 40, rect)).toBe(true); // a little slack for a finger
    expect(insideBoard(150, 200, rect)).toBe(false);
    expect(insideBoard(150, 40, null)).toBe(false);
  });
});
