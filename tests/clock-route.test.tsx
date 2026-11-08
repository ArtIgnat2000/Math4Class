import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { clockModel } from '../src/engine/clock';
import { CLOCK_ROUTES, routeModel } from '../src/engine/clock-route';
import { ClockRouteGame } from '../src/ui/ClockRouteGame';
import { SpokenClockPilot } from '../src/ui/SpokenClockPilot';

describe('route through the hour', () => {
  it('counts five-minute steps accurately through the hour and midnight', () => {
    const route = { start: 23 * 60 + 50, duration: 20, event: 'Событие' };
    expect(routeModel(route, 0)).toMatchObject({
      current: { hour: 23, minute: 50 },
      remaining: 20,
      done: false,
    });
    expect(routeModel(route, 10)).toMatchObject({
      current: { hour: 0, minute: 0 },
      elapsed: 10,
      remaining: 10,
    });
    expect(routeModel(route, 20)).toMatchObject({
      current: { hour: 0, minute: 10 },
      remaining: 0,
      done: true,
    });
    for (const route of CLOCK_ROUTES)
      for (let elapsed = 0; elapsed <= route.duration; elapsed += 5) {
        const state = routeModel(route, elapsed);
        expect(state.remaining + state.elapsed).toBe(route.duration);
        expect(
          [15, 30, 45].includes(state.current.minute) && [4, 12, 6].includes(state.current.hour),
        ).toBe(false);
      }
  });
  it('rejects invalid routes and elapsed values', () => {
    const route = CLOCK_ROUTES[0];
    for (const elapsed of [-5, 3, route.duration + 5, NaN])
      expect(() => routeModel(route, elapsed)).toThrow(RangeError);
    for (const invalid of [
      { ...route, start: 1440 },
      { ...route, start: 1 },
      { ...route, duration: 60 },
      { ...route, duration: 0 },
    ])
      expect(() => routeModel(invalid, 0)).toThrow(RangeError);
  });
  it('lets children choose a start, advance, undo, finish and reset without progress', async () => {
    const user = userEvent.setup();
    const exit = vi.fn();
    const { container } = render(<ClockRouteGame onExit={exit} />);
    expect(screen.getByRole('status')).toHaveTextContent('Сейчас 07:10');
    expect(screen.getByRole('status')).toHaveTextContent('Прошло: 0 мин');
    expect(screen.getByRole('status')).toHaveTextContent('До события: 25 мин');
    expect(container.querySelector('[data-route-arc="passed"]')).not.toBeInTheDocument();
    expect(container.querySelector('[data-route-arc="remaining"]')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Назад на 5 минут' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Вперёд на 5 минут' }));
    expect(screen.getByRole('status')).toHaveTextContent('Сейчас 07:15');
    expect(screen.getByRole('status')).toHaveTextContent('Прошло: 5 мин');
    expect(screen.getByRole('status')).toHaveTextContent('До события: 20 мин');
    expect(container.querySelector('[data-route-arc="passed"]')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Назад на 5 минут' }));
    expect(screen.getByRole('status')).toHaveTextContent('Сейчас 07:10');
    await user.click(screen.getByRole('button', { name: 'Начало 07:40' }));
    for (let i = 0; i < 5; i++)
      await user.click(screen.getByRole('button', { name: 'Вперёд на 5 минут' }));
    expect(screen.getByRole('status')).toHaveTextContent('Сейчас 08:05');
    expect(screen.getByRole('status')).toHaveTextContent('Событие началось');
    expect(screen.getByRole('button', { name: 'Вперёд на 5 минут' })).toBeDisabled();
    expect(container.querySelector('[data-route-arc="remaining"]')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Подсказка' }));
    expect(screen.getByText(/Каждый шаг — 5 минут/)).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Заново' }));
    expect(screen.getByRole('status')).toHaveTextContent('Сейчас 07:40');
    expect(screen.getByRole('img')).toHaveAccessibleName(
      /Начало 07:40.*Сейчас 07:40.*осталось 25 минут/,
    );
    expect(localStorage.length).toBe(0);
    await user.click(screen.getByRole('button', { name: 'К объяснению' }));
    expect(exit).toHaveBeenCalledOnce();
  });
  it('offers the route at every step and returns to the same example', async () => {
    const user = userEvent.setup();
    const practice = vi.fn();
    render(<SpokenClockPilot onPractice={practice} />);
    for (let step = 0; step < 3; step++) {
      await user.click(screen.getByRole('button', { name: 'Другой пример' }));
      const words = ['четверть восьмого', 'половина шестого', 'без пяти восемь'][step];
      expect(screen.getByText(words)).toBeVisible();
      await user.click(
        within(screen.getByRole('group', { name: 'Игры' })).getByRole('button', {
          name: 'Маршрут по часу',
        }),
      );
      await user.click(screen.getByRole('button', { name: 'Вперёд на 5 минут' }));
      await user.click(screen.getByRole('button', { name: 'К объяснению' }));
      expect(screen.getByText(words)).toBeVisible();
      if (step < 2) await user.click(screen.getByRole('button', { name: 'Дальше' }));
    }
    expect(practice).not.toHaveBeenCalled();
    expect(CLOCK_ROUTES.map((route) => clockModel(routeModel(route, 0).start).digital)).toEqual([
      '07:10',
      '07:40',
      '10:50',
    ]);
  });
});
