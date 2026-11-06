/**
 * Roman numerals I–XX: the whole mathematical model of the lesson lives here so
 * every screen and every test shares one checked implementation (MODEL-01).
 * Only I, V and X exist in this lesson; the owner fixed the range on 6 Nov 2026.
 */
export const ROMAN_MAX = 20;

export type RomanSign = 'I' | 'V' | 'X';

export const ROMAN_SIGNS: { sign: RomanSign; value: number; name: string }[] = [
  { sign: 'I', value: 1, name: 'один' },
  { sign: 'V', value: 5, name: 'пять' },
  { sign: 'X', value: 10, name: 'десять' },
];

const RECORDS = [
  '',
  'I',
  'II',
  'III',
  'IV',
  'V',
  'VI',
  'VII',
  'VIII',
  'IX',
  'X',
  'XI',
  'XII',
  'XIII',
  'XIV',
  'XV',
  'XVI',
  'XVII',
  'XVIII',
  'XIX',
  'XX',
] as const;

export function inRange(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= ROMAN_MAX;
}

/** Canonical record of a number, or null outside the lesson range. */
export function toRoman(value: number): string | null {
  return inRange(value) ? RECORDS[value] : null;
}

const SIGN_VALUE: Record<string, number> = { I: 1, V: 5, X: 10 };

/**
 * Arithmetic value of a record written with I, V, X. A smaller sign before a
 * bigger one is subtracted, which is exactly the rule the child discovers.
 * Returns null for an empty record or an unknown sign.
 */
export function romanValue(record: string): number | null {
  const signs = record.trim().toUpperCase().split('');
  if (!signs.length || signs.some((sign) => !(sign in SIGN_VALUE))) return null;
  let total = 0;
  for (let i = 0; i < signs.length; i += 1) {
    const value = SIGN_VALUE[signs[i]];
    const next = i + 1 < signs.length ? SIGN_VALUE[signs[i + 1]] : 0;
    total += value < next ? -value : value;
  }
  return total;
}

export type RomanIssue = 'empty' | 'unknown' | 'repeat' | 'order' | 'range';

/** Why a record is not the way Romans write this number. */
export function romanIssue(record: string): RomanIssue | null {
  const clean = record.trim().toUpperCase();
  if (!clean) return 'empty';
  if ([...clean].some((sign) => !(sign in SIGN_VALUE))) return 'unknown';
  const value = romanValue(clean);
  if (value === null || !inRange(value)) return 'range';
  return toRoman(value) === clean ? null : 'order';
}

/** Causal feedback: it explains the rule, never judges the child. */
export function romanIssueText(issue: RomanIssue, record = ''): string {
  const clean = record.trim().toUpperCase();
  if (issue === 'empty') return 'Добавь знак: I, V или X.';
  if (issue === 'unknown') return 'В этом уроке только знаки I, V и X.';
  if (issue === 'range') return `Пока считаем до ${RECORDS[ROMAN_MAX]} — это ${ROMAN_MAX}.`;
  if (/IIII/.test(clean)) return 'Четыре I подряд не пишут. Поставь I перед V: IV — это 4.';
  if (/VV/.test(clean)) return 'Две пятёрки — это X. Замени VV на X.';
  if (/XXXX/.test(clean)) return 'Пока хватает двух X: XX — это 20.';
  if (/IXI|IVI/.test(clean)) return 'Меньший знак ставят слева только один раз: IV — 4, IX — 9.';
  return 'Меньший знак справа прибавляют, слева — вычитают. Попробуй короче.';
}

export type RomanAppend = {
  record: string;
  value: number | null;
  issue: RomanIssue | null;
  message: string | null;
};

/**
 * Add a sign the way the builder does: the record stays canonical, and an
 * attempt that breaks a rule returns the reason instead of a broken record.
 */
export function appendSign(record: string, sign: RomanSign): RomanAppend {
  const next = `${record}${sign}`;
  const value = romanValue(next);
  const issue = romanIssue(next);
  if (issue) {
    return { record, value: romanValue(record), issue, message: romanIssueText(issue, next) };
  }
  return { record: next, value, issue: null, message: null };
}

/** Split a canonical record into the signs a child actually places. */
export function romanSigns(record: string): RomanSign[] {
  return [...record].filter((sign): sign is RomanSign => sign in SIGN_VALUE);
}

/** Every number of the lesson, for the clock dial and for tests. */
export const ROMAN_NUMBERS = Array.from({ length: ROMAN_MAX }, (_, index) => ({
  value: index + 1,
  record: RECORDS[index + 1],
}));

/** Numbers of the clock dial: I–XII, the familiar twelve-part circle. */
export const CLOCK_NUMBERS = ROMAN_NUMBERS.slice(0, 12);

/**
 * Targets of the building game: they cover one sign, repetition, both
 * subtractive pairs and the second decade. Never random, so a child always
 * meets the same teaching sequence and tests stay deterministic.
 */
export const BUILD_TARGETS = [3, 5, 6, 4, 9, 10, 12, 14, 19, 20] as const;

/** A shuffled dial order for the clock game; never deals a solved board. */
export function shuffledTargets(random: () => number = Math.random): number[] {
  const order = CLOCK_NUMBERS.map((item) => item.value);
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  if (order.every((value, index) => value === index + 1)) order.reverse();
  return order;
}
