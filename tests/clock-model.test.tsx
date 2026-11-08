import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  clockModel,
  otherHalfOfDay,
  clockMinuteArc,
  CLOCK_READ_ROUNDS,
  CLOCK_SET_ROUNDS,
  CLOCK_AFTERNOON_HOURS,
  CLOCK_MINUTES,
} from '../src/engine/clock';
import { ClockDial } from '../src/ui/ClockDial';

describe('24-hour clock model', () => {
  it('handles midnight, noon and moving hour hands', () => {
    expect(clockModel({ hour: 0, minute: 0 })).toMatchObject({
      digital: '00:00',
      dialHour: 12,
      hourAngle: 0,
      minuteAngle: 0,
    });
    expect(clockModel({ hour: 12, minute: 0 })).toMatchObject({
      digital: '12:00',
      dialHour: 12,
      hourAngle: 0,
    });
    expect(clockModel({ hour: 13, minute: 30 })).toMatchObject({
      digital: '13:30',
      dialHour: 1,
      hourAngle: 45,
      minuteAngle: 180,
    });
    expect(clockModel({ hour: 23, minute: 59 })).toMatchObject({
      digital: '23:59',
      hourAngle: 359.5,
      minuteAngle: 354,
    });
  });
  it('preserves both hands across all twelve-hour pairs', () => {
    for (let hour = 0; hour < 24; hour++)
      for (let minute = 0; minute < 60; minute++) {
        const time = { hour, minute };
        const other = otherHalfOfDay(time);
        expect(otherHalfOfDay(other)).toEqual(time);
        expect(clockModel(other).hourAngle).toBe(clockModel(time).hourAngle);
        expect(clockModel(other).minuteAngle).toBe(clockModel(time).minuteAngle);
      }
  });
  it('computes elapsed and remaining arcs for every minute', () => {
    for (let minute = 0; minute < 60; minute++) {
      const passed = clockMinuteArc(minute, 'passed');
      const remaining = clockMinuteArc(minute, 'remaining');
      expect(passed.minutes + remaining.minutes).toBe(60);
      expect(passed.start).toBe(0);
      expect(remaining.start).toBe(minute);
      expect(remaining.length).toBe(60 - minute);
    }
    expect(() => clockMinuteArc(60, 'passed')).toThrow(RangeError);
  });
  it('has varied valid rounds without exposing the answers to exercise 230', () => {
    expect(CLOCK_READ_ROUNDS.length).toBeGreaterThanOrEqual(4);
    expect(CLOCK_SET_ROUNDS.length).toBeGreaterThanOrEqual(5);
    expect(CLOCK_AFTERNOON_HOURS.length).toBeGreaterThan(2);
    expect(new Set(CLOCK_MINUTES).size).toBe(12);
    for (const scene of CLOCK_READ_ROUNDS) {
      expect(scene.options).toContain(scene.hour);
      expect(new Set(scene.options).size).toBe(3);
      expect(scene.hour).toBeGreaterThanOrEqual(18);
      expect(scene.options).not.toContain(9);
      expect(scene.options).not.toContain(2);
      expect(scene.options).not.toContain(15);
    }
    for (const scene of CLOCK_SET_ROUNDS) {
      expect(scene.choices).toContain(scene.hour - 12);
      expect(new Set(scene.choices).size).toBe(3);
      expect([2, 9, 15]).not.toContain(scene.hour);
    }
  });
  it('draws the correct elapsed or remaining arc, including zero and a whole hour', () => {
    const { container, rerender } = render(
      <ClockDial time={{ hour: 6, minute: 0 }} label="Часы" highlight="passed" />,
    );
    expect(container.querySelector('[data-minute-arc]')).not.toBeInTheDocument();
    rerender(<ClockDial time={{ hour: 6, minute: 0 }} label="Часы" highlight="remaining" />);
    expect(container.querySelector('circle[data-minute-arc="remaining"]')).toBeInTheDocument();
    rerender(<ClockDial time={{ hour: 6, minute: 45 }} label="Часы" highlight="passed" />);
    expect(container.querySelector('path[data-minute-arc="passed"]')).toHaveAttribute(
      'd',
      expect.stringContaining('A 114 114 0 1 1'),
    );
  });
  it('rejects invalid values rather than silently wrapping', () => {
    for (const time of [
      { hour: 24, minute: 0 },
      { hour: -1, minute: 0 },
      { hour: 1, minute: 60 },
      { hour: 1.5, minute: 0 },
      { hour: 1, minute: NaN },
    ]) {
      expect(() => clockModel(time)).toThrow(RangeError);
    }
  });
  it('provides a caller-controlled accessible description without adding the digital answer', () => {
    const { container } = render(
      <ClockDial time={{ hour: 13, minute: 30 }} label="Стрелочные часы" />,
    );
    expect(screen.getByRole('img', { name: 'Стрелочные часы' })).toBeInTheDocument();
    expect(container.textContent).not.toContain('13:30');
    expect(container.querySelectorAll('text')).toHaveLength(12);
    expect(container.querySelectorAll('rect')).toHaveLength(60);
    expect(container.querySelector('[data-hand="hour"]')).toHaveAttribute(
      'transform',
      'rotate(45 120 120)',
    );
    expect(container.querySelector('[data-hand="minute"]')).toHaveAttribute(
      'transform',
      'rotate(180 120 120)',
    );
  });
});
