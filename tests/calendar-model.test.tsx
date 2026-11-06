import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  CALENDAR_MONTHS,
  MONTH_SECTOR_VIEWBOX,
  MonthSector,
  YearRing,
  YearToken,
  quantityFromLabel,
} from '../src/ui/CalendarModel';
import { CalendarToken, CalendarVisual } from '../src/ui/CalendarVisual';

describe('shared circle/sector calendar model', () => {
  it('parses Cyrillic year and month quantities without leaking question labels', () => {
    expect(quantityFromLabel('4 года', 'year')).toBe(4);
    expect(quantityFromLabel('2 года', 'year')).toBe(2);
    expect(quantityFromLabel('3 месяца', 'month')).toBe(3);
    expect(quantityFromLabel('12 месяцев', 'month')).toBe(12);
    expect(quantityFromLabel('в месяцах?', 'month')).toBeNull();
    expect(quantityFromLabel('в годах и месяцах?', 'year')).toBeNull();
  });

  it('uses one twelve-sector ring with three sectors per season', () => {
    const { container } = render(<YearRing label="Круг года" />);
    const sectors = container.querySelectorAll('.year-sector');
    expect(sectors).toHaveLength(12);
    for (const season of ['winter', 'spring', 'summer', 'autumn']) {
      expect(container.querySelectorAll(`.year-sector[data-season="${season}"]`)).toHaveLength(3);
    }
    expect(container.querySelectorAll('.year-sector.is-filled')).toHaveLength(12);
    expect(CALENDAR_MONTHS).toHaveLength(12);
  });

  it('fills only the chosen sectors when a game places months out of order', () => {
    const { container } = render(<YearRing filled={0} filledIndices={[4, 11]} label="Круг года" />);
    const sectors = container.querySelectorAll('.year-sector');
    expect(container.querySelectorAll('.year-sector.is-filled')).toHaveLength(2);
    expect(sectors[4]).toHaveClass('is-filled');
    expect(sectors[11]).toHaveClass('is-filled');
    expect(sectors[0]).not.toHaveClass('is-filled');
    // An explicit empty list must win over the `filled` count.
    const empty = render(<YearRing filled={12} filledIndices={[]} label="Пустой круг" />);
    expect(empty.container.querySelectorAll('.year-sector.is-filled')).toHaveLength(0);
  });

  it('shows several years as several whole rings, not as a computed total', () => {
    const { container } = render(<YearToken label="4 года" />);
    expect(container.querySelectorAll('.calendar-task-year-ring')).toHaveLength(4);
    expect(container.querySelectorAll('.year-sector')).toHaveLength(48);
    expect(screen.getByText('4 года')).toBeVisible();
    expect(screen.queryByText(/48/)).not.toBeInTheDocument();
  });

  it('renders the approved year/month questions with sectors and no answer', () => {
    const four = render(<CalendarVisual topicId="calendar-years-months" taskId="four-years" />);
    expect(four.container.querySelectorAll('.calendar-task-year-ring')).toHaveLength(4);
    expect(four.container.querySelectorAll('.calendar-question-chip')).toHaveLength(1);
    expect(four.container.querySelectorAll('img')).toHaveLength(0);
    expect(four.container.textContent).not.toMatch(/48/);

    const mixed = render(<CalendarVisual topicId="calendar-years-months" taskId="two-three" />);
    expect(mixed.container.querySelectorAll('.calendar-task-year-ring')).toHaveLength(2);
    expect(
      mixed.container.querySelectorAll('.calendar-month-sector-group .calendar-month-sector'),
    ).toHaveLength(3);
    expect(mixed.container.querySelectorAll('img')).toHaveLength(0);
    expect(mixed.container.textContent).not.toMatch(/27/);
  });

  it('draws named months and seasons as sector tokens, while unknown months stay neutral', () => {
    const april = render(<CalendarToken token={{ kind: 'month', label: 'Апрель' }} />);
    expect(april.container.querySelector('.calendar-month-sector')).toHaveClass('season-spring');
    const winter = render(
      <CalendarToken token={{ kind: 'season', label: 'Зима', season: 'winter' }} />,
    );
    expect(winter.container.querySelector('.calendar-season-sector')).toHaveClass('season-winter');
    const unknown = render(<CalendarToken token={{ kind: 'month', label: 'IV' }} />);
    expect(unknown.container.querySelector('.calendar-month-sector')).toHaveClass('season-unknown');
    expect(unknown.container.textContent).not.toMatch(/апрель|4/i);
  });
});

describe('a loose month stays as readable as a whole year', () => {
  it('crops the viewBox to the wedge so the glyph fills its box', () => {
    const { container } = render(<MonthSector label="+ 1 месяц" />);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('viewBox')).toBe(MONTH_SECTOR_VIEWBOX);
    const [minX, minY, width, height] = MONTH_SECTOR_VIEWBOX.split(' ').map(Number);
    // The drawn wedge spans x 46..74 and y 24..52; a tight box keeps it >80% of the side.
    expect(width).toBeLessThanOrEqual(36);
    expect(height).toBeLessThanOrEqual(36);
    expect(minX).toBeLessThanOrEqual(46);
    expect(minX + width).toBeGreaterThanOrEqual(74);
    expect(minY).toBeLessThanOrEqual(24);
    expect(minY + height).toBeGreaterThanOrEqual(52);
  });

  it('marks an unseasoned month so styling can keep it neutral but never pale', () => {
    const loose = render(<MonthSector label="+ 1 месяц" />);
    const token = loose.container.querySelector('.calendar-month-sector')!;
    expect(token).toHaveClass('season-unknown');
    expect(token).toHaveAttribute('data-month-sector', 'unknown');
    // Every month token shares one primitive, so the fix applies in all contexts.
    const named = render(<MonthSector label="Апрель" />);
    expect(named.container.querySelector('svg')!.getAttribute('viewBox')).toBe(
      MONTH_SECTOR_VIEWBOX,
    );
    expect(named.container.querySelector('.calendar-month-sector')).toHaveAttribute(
      'data-month-sector',
      'spring',
    );
  });
});
