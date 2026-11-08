/** Mathematical model of a 24-hour civil clock. The dial alone never specifies AM/PM. */
export interface ClockTime {
  hour: number;
  minute: number;
}

export function clockModel(time: ClockTime) {
  const { hour, minute } = time;
  if (
    !Number.isInteger(hour) ||
    hour < 0 ||
    hour > 23 ||
    !Number.isInteger(minute) ||
    minute < 0 ||
    minute > 59
  ) {
    throw new RangeError('Время должно быть от 00:00 до 23:59');
  }
  const dialHour = hour % 12 || 12;
  return {
    digital: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
    dialHour,
    // Angles are clockwise from twelve; the hour hand moves between the numbers.
    hourAngle: (hour % 12) * 30 + minute / 2,
    minuteAngle: minute * 6,
    period: hour < 6 ? 'ночь' : hour < 12 ? 'утро' : hour < 18 ? 'день' : 'вечер',
  } as const;
}

/** Same position of both hands repeats twelve hours later. */
export function otherHalfOfDay(time: ClockTime): ClockTime {
  clockModel(time);
  return { hour: (time.hour + 12) % 24, minute: time.minute };
}

/** Curated training scenes avoid the answers in the current exercise 230. */
export const CLOCK_AFTERNOON_HOURS = [5, 6, 7, 8, 10, 11] as const;
export const CLOCK_MINUTES = [10, 20, 30, 40, 50, 0, 5, 15, 25, 35, 45, 55] as const;
export const CLOCK_READ_ROUNDS = [
  { hour: 20, options: [8, 20, 10] },
  { hour: 22, options: [10, 22, 8] },
  { hour: 23, options: [11, 20, 23] },
  { hour: 19, options: [7, 19, 22] },
] as const;
export const CLOCK_SET_ROUNDS = [
  { hour: 17, choices: [4, 5, 6] },
  { hour: 18, choices: [5, 6, 7] },
  { hour: 19, choices: [6, 7, 8] },
  { hour: 22, choices: [8, 10, 11] },
  { hour: 23, choices: [4, 10, 11] },
] as const;

export function nextClockValue(values: readonly number[], value: number): number {
  const index = values.indexOf(value);
  if (index < 0 || values.length === 0) throw new RangeError('Неизвестное значение часов');
  return values[(index + 1) % values.length];
}

/** Angles for the visible part of a 60-minute ring, clockwise from twelve. */
export function clockMinuteArc(minute: number, part: 'passed' | 'remaining') {
  if (!Number.isInteger(minute) || minute < 0 || minute > 59) {
    throw new RangeError('Минуты должны быть от 0 до 59');
  }
  return part === 'passed'
    ? { start: 0, length: minute, minutes: minute }
    : { start: minute, length: 60 - minute, minutes: 60 - minute };
}

/** Explanation and unscored training use times distinct from exercise 231 answers. */
export const SPOKEN_CLOCK_SCENES = [
  [
    {
      time: { hour: 6, minute: 15 },
      words: 'четверть седьмого',
      also: 'шесть пятнадцать',
      explanation: '15 минут после шести',
      insight: 'Седьмой час начался после шести.',
      part: 'passed',
    },
    {
      time: { hour: 7, minute: 15 },
      words: 'четверть восьмого',
      also: 'семь пятнадцать',
      explanation: '15 минут после семи',
      insight: 'Восьмой час начался после семи.',
      part: 'passed',
    },
    {
      time: { hour: 7, minute: 5 },
      words: 'пять минут восьмого',
      also: 'семь ноль пять',
      explanation: '5 минут после семи',
      insight: 'Восьмой час начался после семи.',
      part: 'passed',
    },
    {
      time: { hour: 7, minute: 10 },
      words: 'десять минут восьмого',
      also: 'семь десять',
      explanation: '10 минут после семи',
      insight: 'Восьмой час начался после семи.',
      part: 'passed',
    },
    {
      time: { hour: 8, minute: 20 },
      words: 'двадцать минут девятого',
      also: 'восемь двадцать',
      explanation: '20 минут после восьми',
      insight: 'Девятый час начался после восьми.',
      part: 'passed',
    },
    {
      time: { hour: 8, minute: 25 },
      words: 'двадцать пять минут девятого',
      also: 'восемь двадцать пять',
      explanation: '25 минут после восьми',
      insight: 'Девятый час начался после восьми.',
      part: 'passed',
    },
  ],
  [
    {
      time: { hour: 4, minute: 30 },
      words: 'половина пятого',
      also: 'четыре тридцать',
      explanation: '30 минут после четырёх',
      insight: 'Половина часа — 30 минут.',
      part: 'passed',
    },
    {
      time: { hour: 5, minute: 30 },
      words: 'половина шестого',
      also: 'пять тридцать',
      explanation: '30 минут после пяти',
      insight: 'Половина часа — 30 минут.',
      part: 'passed',
    },
    {
      time: { hour: 7, minute: 30 },
      words: 'половина восьмого',
      also: 'семь тридцать',
      explanation: '30 минут после семи',
      insight: 'Половина часа — 30 минут.',
      part: 'passed',
    },
    {
      time: { hour: 8, minute: 30 },
      words: 'половина девятого',
      also: 'восемь тридцать',
      explanation: '30 минут после восьми',
      insight: 'Половина часа — 30 минут.',
      part: 'passed',
    },
    {
      time: { hour: 10, minute: 30 },
      words: 'половина одиннадцатого',
      also: 'десять тридцать',
      explanation: '30 минут после десяти',
      insight: 'Половина часа — 30 минут.',
      part: 'passed',
    },
  ],
  [
    {
      time: { hour: 5, minute: 55 },
      words: 'без пяти шесть',
      also: 'пять пятьдесят пять',
      explanation: '5 минут до шести',
      insight: 'Считаем минуты до следующего часа.',
      part: 'remaining',
    },
    {
      time: { hour: 7, minute: 55 },
      words: 'без пяти восемь',
      also: 'семь пятьдесят пять',
      explanation: '5 минут до восьми',
      insight: 'Считаем минуты до следующего часа.',
      part: 'remaining',
    },
    {
      time: { hour: 7, minute: 50 },
      words: 'без десяти восемь',
      also: 'семь пятьдесят',
      explanation: '10 минут до восьми',
      insight: 'Считаем минуты до следующего часа.',
      part: 'remaining',
    },
    {
      time: { hour: 8, minute: 40 },
      words: 'без двадцати девять',
      also: 'восемь сорок',
      explanation: '20 минут до девяти',
      insight: 'Считаем минуты до следующего часа.',
      part: 'remaining',
    },
    {
      time: { hour: 8, minute: 45 },
      words: 'без четверти девять',
      also: 'восемь сорок пять',
      explanation: '15 минут до девяти',
      insight: 'Четверть часа — 15 минут.',
      part: 'remaining',
    },
    {
      time: { hour: 10, minute: 35 },
      words: 'без двадцати пяти одиннадцать',
      also: 'десять тридцать пять',
      explanation: '25 минут до одиннадцати',
      insight: 'Считаем минуты до следующего часа.',
      part: 'remaining',
    },
  ],
] as const;
export const SPOKEN_CLOCK_GAMES = [
  { ...SPOKEN_CLOCK_SCENES[1][0], options: ['04:30', '05:30', '04:20'], answer: '04:30' },
  { ...SPOKEN_CLOCK_SCENES[0][0], options: ['07:15', '06:15', '06:30'], answer: '06:15' },
  { ...SPOKEN_CLOCK_SCENES[2][0], options: ['06:05', '05:55', '05:05'], answer: '05:55' },
  {
    time: { hour: 7, minute: 40 },
    words: 'семь сорок',
    also: 'без двадцати восемь',
    explanation: '20 минут до восьми',
    insight: 'Считаем минуты до следующего часа.',
    part: 'remaining',
    options: ['07:40', '07:20', '08:40'],
    answer: '07:40',
  },
  { ...SPOKEN_CLOCK_SCENES[0][2], options: ['07:05', '08:05', '07:50'], answer: '07:05' },
  { ...SPOKEN_CLOCK_SCENES[0][4], options: ['09:20', '08:20', '08:40'], answer: '08:20' },
  { ...SPOKEN_CLOCK_SCENES[1][2], options: ['08:30', '07:15', '07:30'], answer: '07:30' },
  { ...SPOKEN_CLOCK_SCENES[2][2], options: ['08:10', '07:50', '07:10'], answer: '07:50' },
  { ...SPOKEN_CLOCK_SCENES[2][3], options: ['09:20', '08:20', '08:40'], answer: '08:40' },
  { ...SPOKEN_CLOCK_SCENES[2][4], options: ['09:15', '08:45', '08:15'], answer: '08:45' },
  { ...SPOKEN_CLOCK_SCENES[2][5], options: ['10:25', '11:25', '10:35'], answer: '10:35' },
] as const;

export function spokenMinuteChoices(minute: number): number[] {
  clockModel({ hour: 0, minute });
  return [0, minute, (minute + 10) % 60, (minute + 20) % 60]
    .filter((value, index, all) => all.indexOf(value) === index)
    .slice(0, 3);
}

/** Reverse game: one correct name and two names of other times. */
export function spokenWordOptions(round: number): string[] {
  if (!Number.isInteger(round) || round < 0 || round >= SPOKEN_CLOCK_GAMES.length) {
    throw new RangeError('Неизвестный раунд');
  }
  const names = [0, 1, 2].map(
    (offset) => SPOKEN_CLOCK_GAMES[(round + offset) % SPOKEN_CLOCK_GAMES.length].words,
  );
  return round % 2 === 0 ? names : [names[1], names[2], names[0]];
}
