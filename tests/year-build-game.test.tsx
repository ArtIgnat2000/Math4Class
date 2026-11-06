import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { YearBuildGame, shuffledMonths } from '../src/ui/YearBuildGame';
import { CALENDAR_MONTHS } from '../src/ui/CalendarModel';
import { STORAGE_KEY } from '../src/state/storage';

const MONTHS = CALENDAR_MONTHS.map((item) => item.full);

function slots() {
  return within(screen.getByRole('group', { name: 'Круг года: места для месяцев' })).getAllByRole(
    'button',
  );
}

function trayChips() {
  return within(screen.getByRole('group', { name: /Коробка/ })).getAllByRole('button');
}

// jsdom implements neither API, and userEvent fires pointer events on every click.
beforeEach(() => {
  document.elementFromPoint = vi.fn(() => null);
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
});

describe('shuffled box of months', () => {
  it('deals every month exactly once and never hands over a solved year', () => {
    for (let seed = 0; seed < 50; seed += 1) {
      let state = seed + 1;
      const order = shuffledMonths(() => {
        state = (state * 1103515245 + 12345) % 2147483648;
        return state / 2147483648;
      });
      expect([...order].sort((a, b) => a - b)).toEqual([...Array(12).keys()]);
      expect(order.some((value, index) => value !== index)).toBe(true);
    }
    // A generator that always deals the solved order must still be corrected.
    expect(shuffledMonths(() => 0)).not.toEqual([...Array(12).keys()]);
  });
});

describe('author’s game «Собери год»', () => {
  it('starts with twelve empty places, twelve months and no score or progress', () => {
    const { container } = render(<YearBuildGame onExit={vi.fn()} />);
    expect(slots()).toHaveLength(12);
    expect(trayChips()).toHaveLength(12);
    expect(container.querySelectorAll('.year-game-clock .year-sector.is-filled')).toHaveLength(0);
    expect(container.querySelector('.year-clock-center strong')).toHaveTextContent('0');
    expect(screen.queryByText(/Авторская игра/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Проверить себя' })).not.toBeInTheDocument();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('places months out of order and fills only the sector that was earned', async () => {
    const user = userEvent.setup();
    const { container } = render(<YearBuildGame onExit={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Май' }));
    expect(screen.getByRole('button', { name: 'Май' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(slots()[4]);

    const filled = container.querySelectorAll('.year-game-clock .year-sector');
    expect(container.querySelectorAll('.year-game-clock .year-sector.is-filled')).toHaveLength(1);
    expect(filled[4]).toHaveClass('is-filled');
    expect(filled[4]).toHaveAttribute('data-season', 'spring');
    expect(filled[0]).not.toHaveClass('is-filled');
    expect(slots()[4]).toHaveAccessibleName('Место 5: Май');
    expect(trayChips()).toHaveLength(11);
    expect(screen.getByRole('status')).toHaveTextContent('Май — 5-й. Верно!');
    expect(container.querySelector('.year-clock-center strong')).toHaveTextContent('1');
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('keeps a wrongly placed month in the box and says which place was tried', async () => {
    const user = userEvent.setup();
    const { container } = render(<YearBuildGame onExit={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Март' }));
    await user.click(slots()[0]);
    expect(trayChips()).toHaveLength(12);
    expect(container.querySelectorAll('.year-game-clock .year-sector.is-filled')).toHaveLength(0);
    expect(screen.getByRole('status')).toHaveTextContent('Март — не 1-й месяц');
    expect(container.querySelector('.year-clock-center strong')).toHaveTextContent('0');
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('refuses an occupied place instead of overwriting a correct month', async () => {
    const user = userEvent.setup();
    render(<YearBuildGame onExit={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Май' }));
    await user.click(slots()[4]);
    await user.click(screen.getByRole('button', { name: 'Июнь' }));
    await user.click(slots()[4]);
    expect(screen.getByRole('status')).toHaveTextContent('Место 5 занято');
    expect(slots()[4]).toHaveAccessibleName('Место 5: Май');
    expect(trayChips()).toHaveLength(11);
  });

  it('highlights the right place on request and completes the year', async () => {
    const user = userEvent.setup();
    const { container } = render(<YearBuildGame onExit={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Сентябрь' }));
    await user.click(screen.getByRole('button', { name: 'Подсказка' }));
    expect(slots()[8]).toHaveClass('is-hint');
    expect(screen.getByRole('status')).toHaveTextContent('Сентябрь — 9-й');

    for (let index = 0; index < 12; index += 1) {
      await user.click(screen.getByRole('button', { name: MONTHS[index] }));
      await user.click(slots()[index]);
    }
    expect(container.querySelectorAll('.year-game-clock .year-sector.is-filled')).toHaveLength(12);
    expect(screen.getByRole('status')).toHaveTextContent('Год собран!');
    expect(container.querySelector('.year-clock-center strong')).toHaveTextContent('12');
    expect(screen.getByRole('button', { name: 'Подсказка' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Ещё раз' }));
    expect(trayChips()).toHaveLength(12);
    expect(container.querySelectorAll('.year-game-clock .year-sector.is-filled')).toHaveLength(0);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('accepts a pointer drag onto a place and returns a month dropped off the circle', () => {
    const { container } = render(<YearBuildGame onExit={vi.fn()} />);
    const chip = screen.getByRole('button', { name: 'Апрель' });
    const place = slots()[3];
    document.elementFromPoint = vi.fn(() => place);

    fireEvent.pointerDown(chip, { pointerId: 1, pointerType: 'touch', clientX: 100, clientY: 400 });
    fireEvent.pointerMove(chip, { pointerId: 1, pointerType: 'touch', clientX: 100, clientY: 300 });
    expect(container.querySelector('.year-game-ghost')).not.toBeNull();
    expect(place).toHaveClass('is-hover');
    fireEvent.pointerUp(chip, { pointerId: 1, pointerType: 'touch', clientX: 100, clientY: 200 });

    expect(place).toHaveAccessibleName('Место 4: Апрель');
    expect(trayChips()).toHaveLength(11);
    expect(container.querySelector('.year-game-ghost')).toBeNull();
    // The click that follows a drag must not select the month again.
    fireEvent.click(chip);
    expect(screen.queryByRole('button', { name: 'Апрель' })).not.toBeInTheDocument();

    const june = screen.getByRole('button', { name: 'Июнь' });
    document.elementFromPoint = vi.fn(() => null);
    fireEvent.pointerDown(june, { pointerId: 2, pointerType: 'mouse', clientX: 100, clientY: 400 });
    fireEvent.pointerMove(june, { pointerId: 2, pointerType: 'mouse', clientX: 20, clientY: 20 });
    fireEvent.pointerUp(june, { pointerId: 2, pointerType: 'mouse', clientX: 20, clientY: 20 });
    expect(trayChips()).toHaveLength(11);
    expect(screen.getByRole('status')).toHaveTextContent('Месяц возвращён');
  });

  it('ignores a cancelled gesture and leaves the explanation on request', async () => {
    const user = userEvent.setup();
    const onExit = vi.fn();
    const { container } = render(<YearBuildGame onExit={onExit} />);
    const chip = screen.getByRole('button', { name: 'Июль' });
    fireEvent.pointerDown(chip, { pointerId: 3, pointerType: 'touch', clientX: 10, clientY: 10 });
    fireEvent.pointerMove(chip, { pointerId: 3, pointerType: 'touch', clientX: 10, clientY: 90 });
    fireEvent.pointerCancel(chip, { pointerId: 3, pointerType: 'touch' });
    expect(container.querySelector('.year-game-ghost')).toBeNull();
    expect(trayChips()).toHaveLength(12);

    await user.click(screen.getByRole('button', { name: 'К объяснению' }));
    expect(onExit).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
