import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CALENDAR_MONTHS } from '../src/ui/CalendarModel';
import { RomanNumeralsPilot } from '../src/ui/RomanNumeralsPilot';
import { RomanClockGame, dialSectorAtPoint } from '../src/ui/RomanClockGame';
import { RomanBuildGame } from '../src/ui/RomanBuildGame';
import { toRoman } from '../src/engine/roman';

const STORAGE_KEY = 'chislo:data:v1';

/** The approved exercises ask for the month behind a numeral, so names must never appear. */
function expectNoMonthNames(container: HTMLElement) {
  const text = container.textContent ?? '';
  for (const month of CALENDAR_MONTHS) {
    expect(text, `month name leaked: ${month.full}`).not.toContain(month.full);
    expect(text, `short month name leaked: ${month.short}`).not.toContain(month.short);
  }
}

describe('roman numerals explanation', () => {
  it('keeps one visible header line, graphic steps and no answer leak on every step', () => {
    const { container } = render(<RomanNumeralsPilot onPractice={vi.fn()} />);
    for (const step of [1, 2, 3]) {
      expect(container.querySelector('.pilot-steps')).toHaveAttribute(
        'aria-label',
        `Шаг ${step} из 3`,
      );
      expect(container.querySelector('.roman-pilot h3')).toHaveClass('sr-only');
      const instruction = container.querySelector('.pilot-instruction');
      if (instruction) expect(instruction).toHaveClass('sr-only');
      expect(container.querySelector('.pilot-topline')!.textContent).toBe('');
      expectNoMonthNames(container);
      if (step < 3) fireEvent.click(screen.getByRole('button', { name: 'Дальше' }));
    }
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('opens a sign to show the sticks it replaces', () => {
    const { container } = render(<RomanNumeralsPilot onPractice={vi.fn()} />);
    expect(screen.getByRole('status')).toHaveTextContent('Нажми знак.');
    fireEvent.click(screen.getByRole('button', { name: 'V 5 — знак V, это 5' }));
    expect(container.querySelectorAll('.roman-stick-bundle i')).toHaveLength(5);
    expect(screen.getByRole('status')).toHaveTextContent('V заменяет 5 палочек.');
    fireEvent.click(screen.getByRole('button', { name: 'X 10 — знак X, это 10' }));
    expect(container.querySelectorAll('.roman-stick-bundle')).toHaveLength(2);
    expect(container.querySelectorAll('.roman-stick-bundle i')).toHaveLength(10);
  });

  it('builds a record, finishes it with a value and explains a refused sign', () => {
    const { container } = render(<RomanNumeralsPilot onPractice={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Дальше' }));
    expect(container.querySelector('.pilot-formula-result')).toHaveTextContent('X = 10');
    fireEvent.click(screen.getByRole('button', { name: 'Добавить V' }));
    expect(container.querySelector('.pilot-formula-result')).toHaveTextContent('XV = 15');
    for (let i = 0; i < 3; i += 1)
      fireEvent.click(screen.getByRole('button', { name: 'Добавить I' }));
    expect(container.querySelector('.pilot-formula-result')).toHaveTextContent('XVIII = 18');
    fireEvent.click(screen.getByRole('button', { name: 'Добавить I' }));
    expect(screen.getByRole('status')).toHaveTextContent('Четыре I подряд не пишут');
    expect(container.querySelector('.pilot-formula-result')).toHaveTextContent('XVIII = 18');
    fireEvent.click(screen.getByRole('button', { name: 'Убрать знак' }));
    expect(container.querySelector('.pilot-formula-result')).toHaveTextContent('XVII = 17');
  });

  it('compares both positions of I and reaches the second decade', () => {
    const { container } = render(<RomanNumeralsPilot onPractice={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Дальше' }));
    fireEvent.click(screen.getByRole('button', { name: 'Дальше' }));
    expect(container.querySelector('.pilot-formula-result')).toHaveTextContent('IV = 4');
    fireEvent.click(screen.getByRole('button', { name: 'I справа' }));
    expect(container.querySelector('.pilot-formula-result')).toHaveTextContent('VI = 6');
    fireEvent.click(screen.getByRole('button', { name: /показать с X/i }));
    expect(container.querySelector('.pilot-formula-result')).toHaveTextContent('XI = 11');
    fireEvent.click(screen.getByRole('button', { name: 'I слева' }));
    expect(container.querySelector('.pilot-formula-result')).toHaveTextContent('IX = 9');
    fireEvent.click(screen.getByRole('button', { name: /добавить десяток впереди/i }));
    expect(container.querySelector('.pilot-formula-result')).toHaveTextContent('XIX = 19');
    expectNoMonthNames(container);
  });

  it('starts the checked session only on an explicit choice and opens both games', () => {
    const onPractice = vi.fn();
    render(<RomanNumeralsPilot onPractice={onPractice} />);
    fireEvent.click(screen.getByRole('button', { name: 'Игра «Римские часы»' }));
    expect(screen.getByRole('group', { name: /Римский циферблат/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'К объяснению' }));
    fireEvent.click(screen.getByRole('button', { name: 'Игра «Собери число»' }));
    expect(screen.getByRole('group', { name: 'Запись числа' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'К объяснению' }));
    expect(onPractice).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Дальше' }));
    fireEvent.click(screen.getByRole('button', { name: 'Дальше' }));
    fireEvent.click(screen.getByRole('button', { name: 'Проверить себя' }));
    expect(onPractice).toHaveBeenCalledOnce();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});

describe('roman clock game', () => {
  it('resolves the sector under a point and ignores the middle hole', () => {
    const rect = { left: 0, top: 0, width: 280, height: 280 } as DOMRect;
    expect(dialSectorAtPoint(140, 20, rect)).toBe(0);
    expect(dialSectorAtPoint(260, 140, rect)).toBe(3);
    expect(dialSectorAtPoint(140, 260, rect)).toBe(6);
    expect(dialSectorAtPoint(20, 140, rect)).toBe(9);
    expect(dialSectorAtPoint(140, 140, rect)).toBeNull();
    expect(dialSectorAtPoint(400, 400, rect)).toBeNull();
    expect(dialSectorAtPoint(10, 10, null)).toBeNull();
  });

  it('accepts the right sector, explains a wrong one and never scores', () => {
    const { container } = render(<RomanClockGame onExit={vi.fn()} />);
    const target = Number(container.querySelector('.roman-dial-center strong')!.textContent);
    const wrong = target === 1 ? 2 : 1;
    fireEvent.click(screen.getByRole('button', { name: `Сектор ${toRoman(wrong)}` }));
    expect(screen.getByRole('status')).toHaveTextContent(`Нужно ${target}.`);
    expect(container.querySelectorAll('.year-sector.is-filled')).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: `Сектор ${toRoman(target)}` }));
    expect(container.querySelectorAll('.year-sector.is-filled')).toHaveLength(1);
    expect(screen.getByRole('status')).toHaveTextContent('Верно!');
    expect(screen.queryByRole('button', { name: 'Проверить себя' })).not.toBeInTheDocument();
    expectNoMonthNames(container);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('fills the whole dial by tapping and offers a restart', () => {
    const { container } = render(<RomanClockGame onExit={vi.fn()} />);
    for (let i = 0; i < 12; i += 1) {
      const target = Number(container.querySelector('.roman-dial-center strong')!.textContent);
      fireEvent.click(screen.getByRole('button', { name: `Сектор ${toRoman(target)}` }));
    }
    expect(container.querySelectorAll('.year-sector.is-filled')).toHaveLength(12);
    expect(screen.getByRole('status')).toHaveTextContent('Часы собраны!');
    fireEvent.click(screen.getByRole('button', { name: 'Ещё раз' }));
    expect(container.querySelectorAll('.year-sector.is-filled')).toHaveLength(0);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('highlights the asked sector on request', () => {
    const { container } = render(<RomanClockGame onExit={vi.fn()} />);
    const target = Number(container.querySelector('.roman-dial-center strong')!.textContent);
    fireEvent.click(screen.getByRole('button', { name: 'Подсказка' }));
    expect(container.querySelectorAll('.year-sector.is-hint')).toHaveLength(1);
    expect(screen.getByRole('status')).toHaveTextContent(`Ищи ${toRoman(target)}`);
  });
});

describe('roman building game', () => {
  it('builds the target from signs, refuses a broken record and moves on', () => {
    const { container } = render(<RomanBuildGame onExit={vi.fn()} />);
    const tray = screen.getByRole('group', { name: 'Знаки' });
    // First target is 3.
    expect(container.querySelector('.roman-build-target strong')).toHaveTextContent('3');
    for (let i = 0; i < 3; i += 1)
      fireEvent.click(within(tray).getByRole('button', { name: 'Добавить I' }));
    expect(screen.getByRole('status')).toHaveTextContent('III — это 3. Верно!');
    fireEvent.click(screen.getByRole('button', { name: 'Дальше' }));
    expect(container.querySelector('.roman-build-target strong')).toHaveTextContent('5');
    fireEvent.click(within(tray).getByRole('button', { name: 'Добавить V' }));
    expect(screen.getByRole('status')).toHaveTextContent('V — это 5. Верно!');
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('explains the rule when four ones are placed in a row', () => {
    const { container } = render(<RomanBuildGame onExit={vi.fn()} />);
    const tray = screen.getByRole('group', { name: 'Знаки' });
    const ones = () => within(tray).getByRole('button', { name: 'Добавить I' });
    for (let i = 0; i < 3; i += 1) fireEvent.click(ones());
    fireEvent.click(screen.getByRole('button', { name: 'Дальше' }));
    // Target 5 is not reached by ones, so the fourth I must be refused with the rule.
    expect(container.querySelector('.roman-build-target strong')).toHaveTextContent('5');
    for (let i = 0; i < 3; i += 1) fireEvent.click(ones());
    fireEvent.click(ones());
    expect(screen.getByRole('status')).toHaveTextContent('Четыре I подряд не пишут');
    expect(screen.getByRole('status')).toHaveTextContent('IV — это 4');
    expect(container.querySelector('.roman-build-value')).toHaveTextContent('= 3');
    expect(container.querySelector('.roman-build-drop')).not.toHaveClass('is-solved');
  });

  it('accepts a dropped sign, erases it and shows a hint', () => {
    const { container } = render(<RomanBuildGame onExit={vi.fn()} />);
    const drop = screen.getByRole('group', { name: 'Запись числа' });
    fireEvent.drop(drop, { dataTransfer: { getData: () => 'I' } });
    expect(container.querySelector('.roman-build-value')).toHaveTextContent('= 1');
    fireEvent.click(screen.getByRole('button', { name: 'Убрать последний знак' }));
    expect(container.querySelector('.roman-build-value')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Подсказка' }));
    expect(container.querySelector('.roman-build-hint')).toHaveTextContent('III');
    expectNoMonthNames(container);
  });
});
