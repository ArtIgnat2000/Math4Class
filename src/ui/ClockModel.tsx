import type { ReactNode } from 'react';
import {
  digitalTime,
  formOf,
  hourProgress,
  spokenDigital,
  spokenTime,
  type ClockTime,
} from '../engine/clock';

const CENTER = 140;
const FACE_RADIUS = 136;
const ARC_RADIUS = 126;
const HOUR_NUMBER_RADIUS = 84;
const MINUTE_HAND = 78;
const HOUR_HAND = 50;

function pointAt(minute: number, radius: number) {
  const angle = ((minute / 60) * 360 - 90) * (Math.PI / 180);
  return { x: CENTER + radius * Math.cos(angle), y: CENTER + radius * Math.sin(angle) };
}

/** Clockwise arc from the top; a full circle becomes two halves. */
function arcPath(fromMinute: number, toMinute: number, radius: number): string {
  const from = pointAt(fromMinute, radius);
  const to = pointAt(toMinute, radius);
  const sweep = toMinute - fromMinute;
  const large = sweep > 30 ? 1 : 0;
  return `M ${from.x.toFixed(2)} ${from.y.toFixed(2)} A ${radius} ${radius} 0 ${large} 1 ${to.x.toFixed(2)} ${to.y.toFixed(2)}`;
}

/** Where the minute-hand buttons sit, in percents of the dial box. */
export function minutePickPoint(minute: number) {
  const point = pointAt(minute, ARC_RADIUS);
  return { left: (point.x / 280) * 100, top: (point.y / 280) * 100 };
}

export function clockLabel(time: ClockTime): string {
  const { passed, remaining } = hourProgress(time);
  if (time.minute === 0) return `Часы показывают ${digitalTime(time)} — ровно ${spokenTime(time)}.`;
  return `Часы показывают ${digitalTime(time)}: ${spokenTime(time)}. Прошло ${passed} минут, до целого часа осталось ${remaining}.`;
}

/**
 * The one clock of the lesson (MODEL-02): a calm face, a green arc for the part
 * of the hour that has passed and an amber arc for what is left. The hand never
 * reaches the numbers, so a value is never covered (MODEL-04).
 */
export function ClockDial({
  time,
  label,
  onMinutePick,
  disabled = false,
  tone = 'quiet',
  children,
}: {
  time: ClockTime;
  label?: string;
  onMinutePick?: (minute: number) => void;
  disabled?: boolean;
  tone?: 'quiet' | 'play';
  children?: ReactNode;
}) {
  const { passed, remaining } = hourProgress(time);
  const hourAngle = (time.hour % 12) * 30 + time.minute * 0.5;
  const minuteTip = pointAt(time.minute, MINUTE_HAND);
  const hourTip = pointAt(hourAngle / 6, HOUR_HAND);
  const minutes = Array.from({ length: 12 }, (_, index) => index * 5);

  return (
    <div className={`clock-dial tone-${tone} ${onMinutePick ? 'is-pickable' : ''}`}>
      <svg viewBox="0 0 280 280" role="img" aria-label={label ?? clockLabel(time)}>
        <circle className="clock-face" cx={CENTER} cy={CENTER} r={FACE_RADIUS} />
        {passed > 0 && (
          <path
            className="clock-arc clock-arc-passed"
            d={arcPath(0, time.minute, ARC_RADIUS)}
            fill="none"
          />
        )}
        {remaining > 0 && (
          <path
            className="clock-arc clock-arc-left"
            d={arcPath(time.minute, 60, ARC_RADIUS)}
            fill="none"
          />
        )}
        {minutes.map((minute) => {
          const major = minute % 15 === 0;
          const from = pointAt(minute, major ? 98 : 102);
          const to = pointAt(minute, 108);
          return (
            <line
              key={minute}
              className={`clock-tick ${major ? 'is-major' : ''}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
            />
          );
        })}
        {Array.from({ length: 12 }, (_, index) => {
          const hour = index === 0 ? 12 : index;
          const point = pointAt(index * 5, HOUR_NUMBER_RADIUS);
          return (
            <text
              key={hour}
              className="clock-number"
              x={point.x}
              y={point.y + 6}
              textAnchor="middle"
            >
              {hour}
            </text>
          );
        })}
        <line
          className="clock-hand clock-hand-hour"
          x1={CENTER}
          y1={CENTER}
          x2={hourTip.x}
          y2={hourTip.y}
        />
        <line
          className="clock-hand clock-hand-minute"
          x1={CENTER}
          y1={CENTER}
          x2={minuteTip.x}
          y2={minuteTip.y}
        />
        <circle className="clock-pivot" cx={CENTER} cy={CENTER} r={7} />
        {children}
      </svg>
      {onMinutePick && (
        <div className="clock-picks" role="group" aria-label="Минутная стрелка">
          {minutes.map((minute) => {
            const point = minutePickPoint(minute);
            return (
              <button
                key={minute}
                type="button"
                className="clock-pick"
                data-clock-minute={minute}
                style={{ left: `${point.left}%`, top: `${point.top}%` }}
                disabled={disabled}
                aria-label={`Поставить минутную стрелку на ${minute === 0 ? '12' : minute} минут`}
                onClick={() => onMinutePick(minute)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

/** The colour key: what the green and amber arcs mean, in minutes. */
export function ClockProgress({ time }: { time: ClockTime }) {
  const { passed, remaining } = hourProgress(time);
  const form = formOf(time);
  return (
    <div className="clock-progress" role="group" aria-label="Части часа">
      <span className="clock-progress-item is-passed">
        <i aria-hidden="true" />
        прошло {passed} мин
      </span>
      <span className="clock-progress-item is-left">
        <i aria-hidden="true" />
        {remaining ? `осталось ${remaining} мин` : 'целый час'}
      </span>
      <span className="sr-only">
        {form === 'half'
          ? 'Прошла половина часа.'
          : form === 'quarter' && time.minute === 15
            ? 'Прошла четверть часа.'
            : form === 'quarter'
              ? 'До целого часа осталась четверть.'
              : form === 'before'
                ? 'До целого часа осталось меньше половины.'
                : ''}
      </span>
    </div>
  );
}

/** The child's readout: the words, the digital time and where the hour sits. */
export function ClockReadout({
  time,
  showDigital = true,
}: {
  time: ClockTime;
  showDigital?: boolean;
}) {
  return (
    <p className="clock-readout" aria-live="polite">
      <strong>{spokenTime(time)}</strong>
      {showDigital && (
        <span>
          {spokenDigital(time) ? `${spokenDigital(time)} · ` : ''}
          {digitalTime(time)}
        </span>
      )}
    </p>
  );
}
