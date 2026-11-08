/**
 * A twelve-hour clock in five-minute steps: the maths and the Russian word forms
 * live here, the components only draw. Two facts drive the whole lesson:
 * the minute hand shows how much of the hour has passed, and after the half-hour
 * people name the *next* hour («без двадцати восемь» — 7:40).
 */
export type ClockTime = { hour: number; minute: number };

export const MINUTES_PER_HOUR = 60;
export const MINUTE_STEP = 5;
export const HOURS_ON_DIAL = 12;

const NOMINATIVE = [
  '',
  'один',
  'два',
  'три',
  'четыре',
  'пять',
  'шесть',
  'семь',
  'восемь',
  'девять',
  'десять',
  'одиннадцать',
  'двенадцать',
];

/** Genitive ordinals: «половина **пятого**». */
const ORDINAL = [
  '',
  'первого',
  'второго',
  'третьего',
  'четвёртого',
  'пятого',
  'шестого',
  'седьмого',
  'восьмого',
  'девятого',
  'десятого',
  'одиннадцатого',
  'двенадцатого',
];

const MINUTES_PAST: Record<number, string> = {
  5: 'пять минут',
  10: 'десять минут',
  20: 'двадцать минут',
  25: 'двадцать пять минут',
};

const MINUTES_TO: Record<number, string> = {
  35: 'без двадцати пяти',
  40: 'без двадцати',
  45: 'без четверти',
  50: 'без десяти',
  55: 'без пяти',
};

export type TimeForm = 'exact' | 'past' | 'quarter' | 'half' | 'before';

function assertStep(minute: number) {
  if (!Number.isInteger(minute) || minute % MINUTE_STEP !== 0)
    throw new Error('Минуты задаются шагом 5');
}

function wrapHour(hour: number): number {
  if (!Number.isInteger(hour)) throw new Error('Час должен быть целым числом');
  return ((((hour - 1) % HOURS_ON_DIAL) + HOURS_ON_DIAL) % HOURS_ON_DIAL) + 1;
}

/** One minute hand position; the hour can be any integer and wraps at 12. */
export function normalizeTime(hour: number, minute: number): ClockTime {
  if (!Number.isInteger(minute)) throw new Error('Минуты должны быть целым числом');
  assertStep(minute);
  const minutes = ((minute % MINUTES_PER_HOUR) + MINUTES_PER_HOUR) % MINUTES_PER_HOUR;
  const extraHours = Math.floor((minute - minutes) / MINUTES_PER_HOUR);
  return { hour: wrapHour(hour + extraHours), minute: minutes };
}

/** Move the minute hand; passing 12 o'clock moves the hour too. */
export function shiftMinutes(time: ClockTime, delta: number): ClockTime {
  return normalizeTime(time.hour, time.minute + delta);
}

export function shiftHours(time: ClockTime, delta: number): ClockTime {
  return { hour: wrapHour(time.hour + delta), minute: time.minute };
}

export function nextHour(hour: number): number {
  return wrapHour(hour + 1);
}

export function previousHour(hour: number): number {
  return wrapHour(hour - 1);
}

export function sameTime(a: ClockTime, b: ClockTime): boolean {
  return a.hour === b.hour && a.minute === b.minute;
}

/** «7:40» — the digital writing a child sees on a phone. */
export function digitalTime(time: ClockTime): string {
  return `${time.hour}:${String(time.minute).padStart(2, '0')}`;
}

/** «без двадцати восемь», «половина пятого», «пять минут девятого». */
export function spokenTime(time: ClockTime): string {
  const { hour, minute } = time;
  if (minute === 0) {
    if (hour === 1) return 'один час';
    return `${NOMINATIVE[hour]} ${hour <= 4 ? 'часа' : 'часов'}`;
  }
  const next = nextHour(hour);
  if (minute === 30) return `половина ${ORDINAL[next]}`;
  if (minute === 15) return `четверть ${ORDINAL[next]}`;
  if (minute < 30) return `${MINUTES_PAST[minute]} ${ORDINAL[next]}`;
  return `${MINUTES_TO[minute]} ${next === 1 ? 'час' : NOMINATIVE[next]}`;
}

const DIGITAL_MINUTES: Record<number, string> = {
  5: 'пять',
  10: 'десять',
  15: 'пятнадцать',
  20: 'двадцать',
  25: 'двадцать пять',
  30: 'тридцать',
  35: 'тридцать пять',
  40: 'сорок',
  45: 'сорок пять',
  50: 'пятьдесят',
  55: 'пятьдесят пять',
};

/**
 * How the same moment is read straight off a phone: «семь сорок» for 7:40.
 * At an exact hour the digital reading is the same as the words, so it is skipped.
 */
export function spokenDigital(time: ClockTime): string {
  if (time.minute === 0) return '';
  return `${NOMINATIVE[time.hour]} ${DIGITAL_MINUTES[time.minute]}`;
}

/** Which part of the phrase the child is looking at. */
export function formOf(time: ClockTime): TimeForm {
  const { minute } = time;
  if (minute === 0) return 'exact';
  if (minute === 30) return 'half';
  if (minute === 15 || minute === 45) return 'quarter';
  return minute < 30 ? 'past' : 'before';
}

/** How much of the hour has already gone and how much is left. */
export function hourProgress(time: ClockTime): { passed: number; remaining: number } {
  return { passed: time.minute, remaining: time.minute === 0 ? 0 : MINUTES_PER_HOUR - time.minute };
}

export function nextWholeHour(hour: number): number {
  return nextHour(hour);
}

/**
 * The exact moments asked for in the checked exercises. Explanation and games
 * never show these pairs, so the child cannot read an answer off the model
 * (NO-LEAK-01); every other time is fair game.
 */
export const CHECKED_TIMES: readonly ClockTime[] = [
  { hour: 5, minute: 30 },
  { hour: 7, minute: 45 },
  { hour: 6, minute: 15 },
  { hour: 6, minute: 45 },
  { hour: 5, minute: 55 },
  { hour: 7, minute: 40 },
  { hour: 8, minute: 20 },
];

export function isCheckedTime(time: ClockTime): boolean {
  return CHECKED_TIMES.some((item) => sameTime(item, time));
}

/** 144 dial positions in five-minute steps. */
export function allTimes(): ClockTime[] {
  const times: ClockTime[] = [];
  for (let hour = 1; hour <= HOURS_ON_DIAL; hour += 1)
    for (let minute = 0; minute < MINUTES_PER_HOUR; minute += MINUTE_STEP)
      times.push({ hour, minute });
  return times;
}

export function gamePool(excluded: readonly ClockTime[] = CHECKED_TIMES): ClockTime[] {
  return allTimes().filter((time) => !excluded.some((item) => sameTime(item, time)));
}

/** A fresh moment for a game round: never the previous one, never a checked answer. */
export function pickTime(
  previous: ClockTime | null,
  random: () => number = Math.random,
  excluded: readonly ClockTime[] = CHECKED_TIMES,
): ClockTime {
  const pool = gamePool(excluded).filter((time) => !previous || !sameTime(previous, time));
  const index = Math.min(pool.length - 1, Math.floor(random() * pool.length));
  return pool[index];
}

export type PhraseChoice = { id: string; label: string; correct: boolean; at: ClockTime };

function candidateTimes(time: ClockTime): ClockTime[] {
  return [
    { hour: previousHour(time.hour), minute: time.minute },
    { hour: nextHour(nextHour(time.hour)), minute: time.minute },
    { hour: time.hour, minute: (time.minute + 30) % MINUTES_PER_HOUR },
    { hour: nextHour(time.hour), minute: (time.minute + 30) % MINUTES_PER_HOUR },
  ];
}

/**
 * Four wordings for one clock: the right one plus the mistakes children really
 * make — naming the current hour instead of the next one, and swapping «прошло»
 * for «осталось» (or the other way round).
 */
export function phraseChoices(
  time: ClockTime,
  random: () => number = Math.random,
  excluded: readonly ClockTime[] = CHECKED_TIMES,
): PhraseChoice[] {
  const correct = spokenTime(time);
  const wrong: { label: string; at: ClockTime }[] = [];
  const add = (candidate: ClockTime) => {
    if (excluded.some((item) => sameTime(item, candidate))) return;
    const label = spokenTime(candidate);
    if (label === correct || wrong.some((item) => item.label === label)) return;
    if (wrong.length < 3) wrong.push({ label, at: candidate });
  };
  for (const candidate of candidateTimes(time)) add(candidate);
  if (wrong.length < 3) for (const candidate of gamePool(excluded)) add(candidate);
  const entries = [{ label: correct, at: time }, ...wrong];
  const order = entries.map((entry, index) => ({ entry, index }));
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = Math.min(i, Math.floor(random() * (i + 1)));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order.map((item) => ({
    id: item.index === 0 ? 'ok' : `w${item.index}`,
    label: item.entry.label,
    correct: item.index === 0,
    at: item.entry.at,
  }));
}

/** The words a child puts together to name a moment, left to right. */
export function phraseWords(time: ClockTime): string[] {
  return spokenTime(time).split(' ');
}

/** One extra word that does not belong: a wrong hour name of the same kind. */
export function phraseDecoy(time: ClockTime): string {
  const words = phraseWords(time);
  const last = words[words.length - 1];
  const options: string[] = [];
  for (const candidate of [shiftHours(time, 1), shiftHours(time, -1), shiftHours(time, 3)]) {
    const other = phraseWords(candidate);
    const word = other.at(-1) ?? '';
    if (word && word !== last && !words.includes(word) && !options.includes(word))
      options.push(word);
  }
  if (!options.length) {
    // An exact hour has the same «часов» at the end, so vary the hour name itself.
    for (const candidate of [shiftHours(time, 1), shiftHours(time, -1)])
      for (const word of phraseWords(candidate))
        if (!words.includes(word) && !options.includes(word)) options.push(word);
  }
  return options[0] ?? '';
}

export type PhraseChip = { id: string; word: string; decoy: boolean };

/** Chips of one phrase plus one word that does not belong, in a stable order. */
export function phraseChips(time: ClockTime, random: () => number = Math.random): PhraseChip[] {
  const words = phraseWords(time);
  const decoy = phraseDecoy(time);
  const chips: PhraseChip[] = words.map((word, index) => ({
    id: `w${index}`,
    word,
    decoy: false,
  }));
  if (decoy) chips.push({ id: 'decoy', word: decoy, decoy: true });
  for (let i = chips.length - 1; i > 0; i -= 1) {
    const j = Math.min(i, Math.floor(random() * (i + 1)));
    [chips[i], chips[j]] = [chips[j], chips[i]];
  }
  return chips;
}

/**
 * A causal message for a phrase the child has not finished yet: names the rule
 * that was broken, never says «неправильно» and never spells out the next word.
 */
export function buildPhraseFeedback(placed: string[], time: ClockTime): string {
  const words = phraseWords(time);
  const step = placed.length - 1;
  if (placed[step] === words[step]) return '';
  if (step === 0) {
    if (words[0] === 'без') return 'Сначала «без»: сколько минут не хватает до целого часа.';
    if (words[0] === 'половина') return 'Сначала «половина»: прошла половина часа.';
    if (words[0] === 'четверть') return 'Сначала «четверть»: прошло 15 минут.';
    return 'Сначала назови минуты.';
  }
  if (step === words.length - 1) return 'Теперь назови час.';
  if (words[step] === 'минут') return 'После числа минут ставь слово «минут».';
  return 'Проверь порядок: сначала минуты, потом час.';
}
