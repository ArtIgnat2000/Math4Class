import type { ClockTime } from './clock';

/** A training route lasts less than one hour; times are minutes since midnight. */
export interface ClockRoute {
  start: number;
  duration: number;
  event: string;
}
export const CLOCK_ROUTES: readonly ClockRoute[] = [
  { start: 7 * 60 + 10, duration: 25, event: 'Начнётся прогулка' },
  { start: 7 * 60 + 40, duration: 25, event: 'Отправится поезд' },
  { start: 10 * 60 + 50, duration: 20, event: 'Начнётся игра' },
];

export function routeModel(route: ClockRoute, elapsed: number) {
  const { start, duration } = route;
  if (
    !Number.isInteger(start) ||
    start < 0 ||
    start >= 1440 ||
    start % 5 !== 0 ||
    !Number.isInteger(duration) ||
    duration < 5 ||
    duration >= 60 ||
    duration % 5 !== 0 ||
    !Number.isInteger(elapsed) ||
    elapsed < 0 ||
    elapsed > duration ||
    elapsed % 5 !== 0
  ) {
    throw new RangeError('Маршрут должен состоять из пятиминутных шагов и длиться меньше часа');
  }
  const asTime = (absolute: number): ClockTime => {
    const minuteOfDay = absolute % 1440;
    return { hour: Math.floor(minuteOfDay / 60), minute: minuteOfDay % 60 };
  };
  return {
    start: asTime(start),
    current: asTime(start + elapsed),
    end: asTime(start + duration),
    elapsed,
    remaining: duration - elapsed,
    done: elapsed === duration,
    startMinute: start % 60,
  };
}
