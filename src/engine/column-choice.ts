/**
 * A choice option can be a written calculation copied from the textbook. When it is,
 * the card shows the numbers as a column instead of a one-line equation, while the
 * option label stays the accessible name and the approval signature.
 */
export interface ColumnChoiceLayout {
  operator: '+' | '−';
  top: string;
  bottom: string;
  result: string;
}

const pattern =
  /^(\d[\d\s\u00a0\u202f]*?)\s*([+−])\s*(\d[\d\s\u00a0\u202f]*?)\s*=\s*(\d[\d\s\u00a0\u202f]*)$/;
const digits = /^\d{1,7}$/;

export function parseColumnChoice(label: string): ColumnChoiceLayout | null {
  const match = label.trim().match(pattern);
  if (!match) return null;
  const clean = (value: string) => value.replace(/[\s\u00a0\u202f]/g, '');
  const top = clean(match[1]);
  const bottom = clean(match[3]);
  const result = clean(match[4]);
  if (![top, bottom, result].every((value) => digits.test(value))) return null;
  // A column result is written under the operands: it cannot be shorter than the
  // longer one and cannot add more than the single extra digit of a carry.
  const longest = Math.max(top.length, bottom.length);
  if (result.length !== longest && result.length !== longest + 1) return null;
  return { operator: match[2] as '+' | '−', top, bottom, result };
}
