import { describe, expect, it } from 'vitest';
import { calendarArtFor } from '../src/ui/CalendarVisual';

describe('calendar picture identities', () => {
  it('uses twelve different month pictures for full and short names', () => {
    const short = [
      'Янв',
      'Фев',
      'Мар',
      'Апр',
      'Май',
      'Июн',
      'Июл',
      'Авг',
      'Сен',
      'Окт',
      'Ноя',
      'Дек',
    ];
    const full = [
      'Январь',
      'Февраль',
      'Март',
      'Апрель',
      'Май',
      'Июнь',
      'Июль',
      'Август',
      'Сентябрь',
      'Октябрь',
      'Ноябрь',
      'Декабрь',
    ];
    const pictures = short.map((label) => calendarArtFor({ kind: 'month', label }));
    expect(new Set(pictures).size).toBe(12);
    full.forEach((label, index) =>
      expect(calendarArtFor({ kind: 'month', label })).toBe(pictures[index]),
    );
  });
  it('does not illustrate the solution to a Roman-numeral or unknown-month question', () => {
    for (const label of ['IV', 'IX', 'XII', '?', 'Месяц?'])
      expect(calendarArtFor({ kind: 'month', label })).toBe('page.webp');
  });
  it('distinguishes years, weeks, intervals and day counts', () => {
    const kinds = ['year', 'week', 'interval', 'days'] as const;
    expect(new Set(kinds.map((kind) => calendarArtFor({ kind, label: '?' }))).size).toBe(4);
  });
});
