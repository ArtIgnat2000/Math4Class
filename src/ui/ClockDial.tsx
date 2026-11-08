import { clockModel, clockMinuteArc, type ClockTime } from '../engine/clock';

/** Railway-inspired, numbered teaching dial. The caller describes the hands without
 * revealing a checked answer; there is deliberately no decorative seconds hand. */
export function ClockDial({
  time,
  label,
  highlight,
}: {
  time: ClockTime;
  label: string;
  highlight?: 'passed' | 'remaining';
}) {
  const { hourAngle, minuteAngle } = clockModel(time);
  const arc = highlight ? clockMinuteArc(time.minute, highlight) : null;
  const point = (minute: number) => {
    const angle = (minute * Math.PI) / 30;
    return { x: 120 + 114 * Math.sin(angle), y: 120 - 114 * Math.cos(angle) };
  };
  const start = arc ? point(arc.start) : null;
  const end = arc ? point(arc.start + arc.length) : null;
  return (
    <svg className="clock-dial-model" viewBox="0 0 240 240" role="img" aria-label={label}>
      <circle cx="120" cy="120" r="112" fill="#fdfcf9" stroke="#25323a" strokeWidth="3" />
      {arc &&
        arc.length > 0 &&
        (arc.length === 60 ? (
          <circle
            data-minute-arc={highlight}
            cx="120"
            cy="120"
            r="114"
            fill="none"
            stroke={highlight === 'passed' ? '#00637a' : '#985400'}
            strokeWidth="6"
          />
        ) : (
          <path
            data-minute-arc={highlight}
            d={`M ${start!.x} ${start!.y} A 114 114 0 ${arc.length > 30 ? 1 : 0} 1 ${end!.x} ${end!.y}`}
            fill="none"
            stroke={highlight === 'passed' ? '#00637a' : '#985400'}
            strokeWidth="6"
          />
        ))}
      {Array.from({ length: 60 }, (_, index) => (
        <rect
          key={index}
          x={index % 5 === 0 ? 118 : 119.2}
          y="12"
          width={index % 5 === 0 ? 4 : 1.6}
          height={index % 5 === 0 ? 12 : 5}
          fill="#25323a"
          transform={`rotate(${index * 6} 120 120)`}
        />
      ))}
      {Array.from({ length: 12 }, (_, index) => {
        const value = index + 1;
        const angle = (value * Math.PI) / 6;
        return (
          <text
            key={value}
            x={120 + 83 * Math.sin(angle)}
            y={120 - 83 * Math.cos(angle)}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#17252e"
            fontSize="20"
            fontWeight="700"
          >
            {value}
          </text>
        );
      })}
      <line
        data-hand="hour"
        x1="120"
        y1="126"
        x2="120"
        y2="68"
        stroke="#17252e"
        strokeWidth="8"
        transform={`rotate(${hourAngle} 120 120)`}
      />
      <line
        data-hand="minute"
        x1="120"
        y1="129"
        x2="120"
        y2="49"
        stroke="#17252e"
        strokeWidth="5"
        transform={`rotate(${minuteAngle} 120 120)`}
      />
      <circle cx="120" cy="120" r="5" fill="#ab2430" />
    </svg>
  );
}
