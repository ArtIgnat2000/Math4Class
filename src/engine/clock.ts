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

/** Separate practice scenes, deliberately different from the checked exercise 231. */
export const SPOKEN_CLOCK_SCENES = [
  [
    {
      time: { hour: 6, minute: 15 },
      words: 'четверть седьмого',
      explanation: '15 минут после шести',
      part: 'passed',
    },
    {
      time: { hour: 7, minute: 15 },
      words: 'четверть восьмого',
      explanation: '15 минут после семи',
      part: 'passed',
    },
  ],
  [
    {
      time: { hour: 4, minute: 30 },
      words: 'половина пятого',
      explanation: '30 минут после четырёх',
      part: 'passed',
    },
    {
      time: { hour: 5, minute: 30 },
      words: 'половина шестого',
      explanation: '30 минут после пяти',
      part: 'passed',
    },
  ],
  [
    {
      time: { hour: 5, minute: 55 },
      words: 'без пяти шесть',
      explanation: '5 минут до шести',
      part: 'remaining',
    },
    {
      time: { hour: 7, minute: 55 },
      words: 'без пяти восемь',
      explanation: '5 минут до восьми',
      part: 'remaining',
    },
  ],
] as const;
export const SPOKEN_CLOCK_GAMES = [
  { ...SPOKEN_CLOCK_SCENES[1][0], options: ['04:30', '05:30', '04:15'], answer: '04:30' },
  { ...SPOKEN_CLOCK_SCENES[0][0], options: ['07:15', '06:15', '06:30'], answer: '06:15' },
  { ...SPOKEN_CLOCK_SCENES[2][0], options: ['06:05', '05:55', '05:05'], answer: '05:55' },
  {
    time: { hour: 7, minute: 40 },
    words: 'семь сорок',
    explanation: '7 часов 40 минут',
    part: 'passed',
    options: ['07:40', '07:20', '08:40'],
    answer: '07:40',
  },
] as const;

export function spokenMinuteChoices(minute: number): number[] {
  clockModel({ hour: 0, minute });
  return [0, minute, (minute + 15) % 60].filter(
    (value, index, all) => all.indexOf(value) === index,
  );
}
