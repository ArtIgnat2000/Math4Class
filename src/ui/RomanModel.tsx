import type { ReactNode } from 'react';
import { yearSectorPath } from './CalendarModel';
import { CLOCK_NUMBERS, ROMAN_SIGNS, type RomanSign } from '../engine/roman';

/**
 * One visual grammar for the whole lesson: a countable stick is one, V and X are
 * short records for a bundle of five and two bundles. Geometry of the dial comes
 * from CalendarModel, so the roman clock is the same circle the child already
 * knows from the year wheel (MODEL-02).
 */
const TONES = ['winter', 'spring', 'summer', 'autumn'] as const;

export function signTone(sign: RomanSign): string {
  return sign === 'I' ? 'winter' : sign === 'V' ? 'summer' : 'autumn';
}

/** Countable ones. Ten are shown as two bundles of five, never as a wall of sticks. */
export function RomanSticks({ count, label }: { count: number; label?: string }) {
  const bundles = count > 5 ? [5, count - 5] : [count];
  return (
    <div className="roman-sticks" role="img" aria-label={label ?? `${count} палочек`}>
      {bundles.map((size, index) => (
        <span className="roman-stick-bundle" key={index} aria-hidden="true">
          {Array.from({ length: size }, (_, stick) => (
            <i key={stick} />
          ))}
        </span>
      ))}
    </div>
  );
}

export function RomanTile({ sign, size = 'md' }: { sign: RomanSign; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <span className={`roman-tile is-${size} tone-${signTone(sign)}`} aria-hidden="true">
      {sign}
    </span>
  );
}

/** The record a child has built, read left to right as tiles. */
export function RomanRecord({
  record,
  placeholder = 'Пусто',
}: {
  record: string;
  placeholder?: string;
}) {
  const signs = [...record] as RomanSign[];
  return (
    <div className="roman-record" role="img" aria-label={record ? `Запись ${record}` : placeholder}>
      {signs.length ? (
        signs.map((sign, index) => <RomanTile key={`${sign}${index}`} sign={sign} />)
      ) : (
        <span className="roman-record-empty" aria-hidden="true">
          {placeholder}
        </span>
      )}
    </div>
  );
}

/** A sign card: the sign itself, its value and, when open, the sticks behind it. */
export function RomanSignCard({
  sign,
  value,
  open,
  onSelect,
}: {
  sign: RomanSign;
  value: number;
  open: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className={`roman-sign-card tone-${signTone(sign)} ${open ? 'is-open' : ''}`}
      aria-pressed={open}
      onClick={onSelect}
    >
      <strong>{sign}</strong>
      <span>{value}</span>
      {/* Label-in-Name: the visible «V 5» stays the start of the accessible name. */}
      <span className="sr-only">
        — знак {sign}, это {value}
      </span>
      {open && <RomanSticks count={value} label={`${sign} — это ${value} палочек`} />}
    </button>
  );
}

export function dialLabelPoint(index: number, radius = 93) {
  const angle = ((index * 30 - 75) * Math.PI) / 180;
  return { x: 140 + radius * Math.cos(angle), y: 140 + radius * Math.sin(angle) };
}

/**
 * The roman dial: twelve sectors with I–XII. Filled sectors keep the cheerful
 * quadrant colours of the year wheel, so the mechanic feels familiar.
 */
export function RomanDial({
  filledIndices = [],
  aim,
  hintIndex,
  missIndex,
  label,
  children,
}: {
  filledIndices?: number[];
  /** Sector under the finger. Never drawn across the centre: it would cover the task number. */
  aim?: number | null;
  hintIndex?: number | null;
  missIndex?: number | null;
  label: string;
  children?: ReactNode;
}) {
  return (
    <svg className="roman-dial-svg" viewBox="0 0 280 280" role="img" aria-label={label}>
      {CLOCK_NUMBERS.map((item, index) => {
        const tone = TONES[Math.floor(index / 3)];
        const point = dialLabelPoint(index);
        return (
          <g key={item.record}>
            <path
              d={yearSectorPath(index)}
              data-tone={tone}
              className={`year-sector season-${tone} ${
                filledIndices.includes(index) ? 'is-filled' : ''
              } ${aim === index ? 'is-aim' : ''} ${hintIndex === index ? 'is-hint' : ''} ${
                missIndex === index ? 'is-miss' : ''
              }`}
            />
            <text x={point.x} y={point.y + 6} textAnchor="middle" className="roman-dial-label">
              {item.record}
            </text>
          </g>
        );
      })}
      <circle cx="140" cy="140" r="58" className="year-ring-center" />
      {children}
    </svg>
  );
}

export const SIGN_LIST = ROMAN_SIGNS;
