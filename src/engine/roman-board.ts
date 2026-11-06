/**
 * Editing the record of «Собери число»: insert a sign at any place, move a
 * placed sign, take it back out. Requested by the owner on 6 Nov 2026 — the
 * board must be genuinely draggable, not append-only.
 *
 * Every edit goes through one gate so a rule broken by a drag is explained
 * exactly like a rule broken by a tap (MODEL-01: one checked model).
 */
import { romanIssue, romanIssueText, romanValue, type RomanIssue, type RomanSign } from './roman';

export type RomanBoard = {
  /** Signs currently on the board, in the order the child placed them. */
  signs: RomanSign[];
  value: number | null;
  issue: RomanIssue | null;
  /** Causal explanation when an edit was refused; null when it was applied. */
  refusal: string | null;
};

export const emptyBoard: RomanBoard = { signs: [], value: null, issue: 'empty', refusal: null };

const describe = (signs: RomanSign[]): RomanBoard => {
  const record = signs.join('');
  const issue = romanIssue(record);
  return { signs, value: record ? romanValue(record) : null, issue, refusal: null };
};

/**
 * Accept an edited order. A record that breaks a rule is refused with the rule
 * itself and the board keeps its previous state, so nothing is ever lost.
 * An empty board is a valid starting point, not an error.
 */
export function commitBoard(previous: RomanSign[], next: RomanSign[]): RomanBoard {
  const record = next.join('');
  const issue = romanIssue(record);
  if (issue && issue !== 'empty') {
    return { ...describe(previous), refusal: romanIssueText(issue, record) };
  }
  return describe(next);
}

/** Place a sign at `index`, clamped to the board length. */
export function insertSign(board: RomanSign[], sign: RomanSign, index: number): RomanBoard {
  const at = Math.max(0, Math.min(index, board.length));
  const next = [...board.slice(0, at), sign, ...board.slice(at)];
  return commitBoard(board, next);
}

/**
 * Move a placed sign to a new position. `to` is an index in the list without
 * the moved sign, which is what a drop between two neighbours means.
 */
export function moveSign(board: RomanSign[], from: number, to: number): RomanBoard {
  if (from < 0 || from >= board.length) return describe(board);
  const rest = board.filter((_, index) => index !== from);
  const at = Math.max(0, Math.min(to, rest.length));
  const next = [...rest.slice(0, at), board[from], ...rest.slice(at)];
  return commitBoard(board, next);
}

/** Take a sign off the board; the remaining record is always kept. */
export function removeSign(board: RomanSign[], index: number): RomanBoard {
  if (index < 0 || index >= board.length) return describe(board);
  return describe(board.filter((_, position) => position !== index));
}

/**
 * Where a drop lands: the gap before the tile whose middle is to the right of
 * the pointer. Measured from real tile boxes, so it works for finger and mouse.
 */
export function dropIndexAt(x: number, boxes: { left: number; width: number }[]): number {
  let index = 0;
  for (const box of boxes) {
    if (x > box.left + box.width / 2) index += 1;
    else break;
  }
  return index;
}

/** Is the pointer inside the board? Used to tell a move from a take-away. */
export function insideBoard(
  x: number,
  y: number,
  rect: { left: number; top: number; width: number; height: number } | null,
  slack = 12,
): boolean {
  if (!rect) return false;
  return (
    x >= rect.left - slack &&
    x <= rect.left + rect.width + slack &&
    y >= rect.top - slack &&
    y <= rect.top + rect.height + slack
  );
}
