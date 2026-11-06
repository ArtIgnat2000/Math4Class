import { Flower2, Leaf, Snowflake, Sun } from 'lucide-react';
import type { ReactNode } from 'react';

export type CalendarSeason = 'winter' | 'spring' | 'summer' | 'autumn';

export const CALENDAR_MONTHS = [
  { short: 'Янв', full: 'Январь', season: 'winter' },
  { short: 'Фев', full: 'Февраль', season: 'winter' },
  { short: 'Мар', full: 'Март', season: 'spring' },
  { short: 'Апр', full: 'Апрель', season: 'spring' },
  { short: 'Май', full: 'Май', season: 'spring' },
  { short: 'Июн', full: 'Июнь', season: 'summer' },
  { short: 'Июл', full: 'Июль', season: 'summer' },
  { short: 'Авг', full: 'Август', season: 'summer' },
  { short: 'Сен', full: 'Сентябрь', season: 'autumn' },
  { short: 'Окт', full: 'Октябрь', season: 'autumn' },
  { short: 'Ноя', full: 'Ноябрь', season: 'autumn' },
  { short: 'Дек', full: 'Декабрь', season: 'winter' },
] as const;

export const CALENDAR_SEASONS = [
  { id: 'winter', name: 'Зима', months: 'Декабрь, январь, февраль' },
  { id: 'spring', name: 'Весна', months: 'Март, апрель, май' },
  { id: 'summer', name: 'Лето', months: 'Июнь, июль, август' },
  { id: 'autumn', name: 'Осень', months: 'Сентябрь, октябрь, ноябрь' },
] as const;

export function SeasonIcon({ season, size = 20 }: { season: CalendarSeason; size?: number }) {
  const props = { size, 'aria-hidden': true as const, focusable: false as const };
  if (season === 'winter') return <Snowflake {...props} />;
  if (season === 'spring') return <Flower2 {...props} />;
  if (season === 'summer') return <Sun {...props} />;
  return <Leaf {...props} />;
}

export function monthByName(label: string) {
  const value = label.toLocaleLowerCase('ru-RU');
  return CALENDAR_MONTHS.find(
    (item) =>
      item.full.toLocaleLowerCase('ru-RU') === value ||
      item.short.toLocaleLowerCase('ru-RU') === value,
  );
}

export function quantityFromLabel(label: string, unit: 'year' | 'month'): number | null {
  // JS `\b` is ASCII-only; Cyrillic unit names need an explicit letter boundary.
  const pattern =
    unit === 'year'
      ? /^(\d+)\s*(?:год|года|лет)(?![а-яё])/i
      : /^(\d+)\s*(?:месяц|месяца|месяцев)(?![а-яё])/i;
  const match = label.trim().match(pattern);
  return match ? Number(match[1]) : null;
}

function polar(cx: number, cy: number, radius: number, degrees: number) {
  const angle = (degrees * Math.PI) / 180;
  return `${cx + radius * Math.cos(angle)} ${cy + radius * Math.sin(angle)}`;
}

/** One annular sector grammar is reused by the year ring and loose tokens. */
export function wedgePath(
  startDegrees: number,
  endDegrees: number,
  outer: number,
  inner: number,
  cx: number,
  cy: number,
) {
  const large = endDegrees - startDegrees > 180 ? 1 : 0;
  return [
    `M${polar(cx, cy, outer, startDegrees)}`,
    `A${outer} ${outer} 0 ${large} 1 ${polar(cx, cy, outer, endDegrees)}`,
    `L${polar(cx, cy, inner, endDegrees)}`,
    `A${inner} ${inner} 0 ${large} 0 ${polar(cx, cy, inner, startDegrees)}`,
    'Z',
  ].join(' ');
}

export function yearSectorPath(index: number, outer = 122, inner = 64) {
  return wedgePath(index * 30 - 90 + 1.2, (index + 1) * 30 - 90 - 1.2, outer, inner, 140, 140);
}

/** The same twelve-part whole is used alone and as a repeated group. */
export function YearRing({
  filled = 12,
  filledIndices,
  label,
  centerLabel,
  className = '',
}: {
  filled?: number;
  /** Explicit sector indices, for games where months are placed out of order. */
  filledIndices?: number[];
  label: string;
  centerLabel?: string;
  className?: string;
}) {
  const isFilled = (index: number) =>
    filledIndices ? filledIndices.includes(index) : index < filled;
  return (
    <svg
      className={`year-ring-svg ${className}`}
      viewBox="0 0 280 280"
      role="img"
      aria-label={label}
    >
      {CALENDAR_MONTHS.map((item, index) => (
        <path
          key={item.full}
          d={yearSectorPath(index)}
          data-season={item.season}
          className={`year-sector season-${item.season} ${isFilled(index) ? 'is-filled' : ''}`}
        />
      ))}
      <circle cx="140" cy="140" r="58" className="year-ring-center" />
      {centerLabel && (
        <text x="140" y="148" textAnchor="middle" className="year-ring-center-label">
          {centerLabel}
        </text>
      )}
    </svg>
  );
}

/**
 * A loose month must read as clearly as a whole year, so the viewBox is cropped
 * to the wedge instead of leaving it floating in a large empty square. With the
 * old `0 0 120 120` box the glyph covered ~23% of its side and looked like a
 * speck next to the year rings.
 */
export const MONTH_SECTOR_VIEWBOX = '43 21 34 34';

export function MonthSector({
  label,
  season,
  showLabel = true,
  className = '',
}: {
  label: string;
  season?: CalendarSeason;
  showLabel?: boolean;
  className?: string;
}) {
  const known = season ?? monthByName(label)?.season;
  return (
    <span
      className={`calendar-month-sector season-${known ?? 'unknown'} ${className}`}
      data-month-sector={known ?? 'unknown'}
    >
      <svg viewBox={MONTH_SECTOR_VIEWBOX} aria-hidden="true" focusable="false">
        <path d={wedgePath(-105, -75, 54, 27, 60, 78)} className="month-sector-path" />
      </svg>
      {showLabel && <strong>{label}</strong>}
    </span>
  );
}

export function SeasonSector({
  season,
  label,
  showLabel = true,
}: {
  season: CalendarSeason;
  label: string;
  showLabel?: boolean;
}) {
  return (
    <span className={`calendar-season-sector season-${season}`}>
      <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">
        {[-135, -105, -75].map((start) => (
          <path
            key={start}
            d={wedgePath(start + 1.2, start + 30 - 1.2, 54, 24, 60, 82)}
            className="season-sector-path"
          />
        ))}
      </svg>
      <span className="season-sector-icon">
        <SeasonIcon season={season} size={22} />
      </span>
      {showLabel && <strong>{label}</strong>}
    </span>
  );
}

export function YearToken({ label }: { label: string }) {
  const count = quantityFromLabel(label, 'year');
  const rings = count && count > 1 ? Math.min(count, 12) : 1;
  return (
    <span className="calendar-year-token">
      <span className="calendar-year-rings">
        {Array.from({ length: rings }, (_, index) => (
          <YearRing
            key={index}
            label={rings > 1 ? `${index + 1}-й год из ${rings}` : label}
            className="calendar-task-year-ring"
          />
        ))}
      </span>
      <strong>{label}</strong>
    </span>
  );
}

export function CalendarModelLegend({ children }: { children?: ReactNode }) {
  return (
    <div className="calendar-model-legend" aria-label="Времена года на круге года">
      {CALENDAR_SEASONS.map((item) => (
        <span key={item.id} className={`calendar-legend-item season-${item.id}`}>
          <SeasonIcon season={item.id} size={16} />
          {item.name}
        </span>
      ))}
      {children}
    </div>
  );
}
