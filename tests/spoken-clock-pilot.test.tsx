import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SpokenClockPilot } from '../src/ui/SpokenClockPilot';
import { getPack } from '../src/content';
import { taskApproved } from '../src/content/approved';
import {
  SPOKEN_CLOCK_GAMES,
  SPOKEN_CLOCK_SCENES,
  clockMinuteArc,
  clockModel,
} from '../src/engine/clock';

describe('spoken time', () => {
  it('models the named times and the highlighted part accurately', () => {
    for (const row of SPOKEN_CLOCK_SCENES)
      for (const scene of row) {
        const arc = clockMinuteArc(scene.time.minute, scene.part);
        expect(arc.minutes).toBe(
          scene.part === 'passed' ? scene.time.minute : 60 - scene.time.minute,
        );
      }
    expect(clockModel(SPOKEN_CLOCK_SCENES[0][0].time).digital).toBe('06:15');
    expect(clockModel(SPOKEN_CLOCK_SCENES[1][0].time).digital).toBe('04:30');
    expect(clockModel(SPOKEN_CLOCK_SCENES[2][0].time).digital).toBe('05:55');
    expect(SPOKEN_CLOCK_GAMES[3].words).toBe('семь сорок');
    for (const scene of SPOKEN_CLOCK_GAMES) {
      expect(clockModel(scene.time).digital).toBe(scene.answer);
      expect(scene.options).toContain(scene.answer);
      expect(new Set(scene.options).size).toBe(3);
    }
  });
  it('changes each scene, trains two ways, retains the step and starts checking separately', async () => {
    const user = userEvent.setup();
    const start = vi.fn();
    render(<SpokenClockPilot onPractice={start} />);
    expect(screen.getByText('четверть седьмого')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Другой пример' }));
    expect(screen.getByText('четверть восьмого')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Узнай время' }));
    await user.click(screen.getByRole('button', { name: '05:30' }));
    expect(screen.getByRole('status')).toHaveTextContent('Попробуй ещё');
    await user.click(screen.getByRole('button', { name: '04:30' }));
    expect(screen.getByRole('status')).toHaveTextContent('Верно');
    for (const answer of ['06:15', '05:55', '07:40']) {
      await user.click(screen.getByRole('button', { name: 'Следующее время' }));
      await user.click(screen.getByRole('button', { name: answer }));
    }
    expect(screen.getByRole('button', { name: 'Играть снова' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Заново' }));
    expect(screen.getByText('половина пятого')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'К объяснению' }));
    expect(screen.getByText('четверть восьмого')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Поверни стрелку' }));
    await user.click(screen.getByRole('button', { name: 'Проверить часы' }));
    expect(screen.getByRole('status')).toHaveTextContent('Попробуй ещё');
    await user.click(
      within(screen.getByRole('group', { name: 'Минуты' })).getByRole('button', { name: '30' }),
    );
    await user.click(screen.getByRole('button', { name: 'Проверить часы' }));
    expect(screen.getByRole('status')).toHaveTextContent('Верно');
    await user.click(screen.getByRole('button', { name: 'Подсказка' }));
    expect(screen.getByText('30 минут после четырёх.')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'К объяснению' }));
    await user.click(screen.getByRole('button', { name: 'Дальше' }));
    expect(screen.getByText('половина пятого')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Другой пример' }));
    expect(screen.getByText('половина шестого')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Дальше' }));
    expect(screen.getByText('без пяти шесть')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Другой пример' }));
    expect(screen.getByText('без пяти восемь')).toBeVisible();
    expect(start).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Проверить себя' }));
    expect(start).toHaveBeenCalledOnce();
  });
  it('locks the conditions, answers and options of the verified exercise 231', () => {
    const topic = getPack(4, []).topics.find((t) => t.id === 'clock-spoken-time')!;
    expect(topic.tasks.map((t) => t.id)).toEqual(['quarter', 'half', 'before']);
    for (const task of topic.tasks) {
      expect(taskApproved(4, topic.id, task)).toBe(true);
      if (task.type !== 'choice') throw new Error('Expected choice');
      const options = task.options.map((option, index) =>
        index ? option : { ...option, label: 'Изменено' },
      );
      expect(taskApproved(4, topic.id, { ...task, options })).toBe(false);
    }
  });
  it('does not solve the checked phrases in teaching or training scenes', () => {
    const forbidden = new Set(['04:15', '12:30', '06:45']);
    for (const row of SPOKEN_CLOCK_SCENES)
      for (const scene of row) {
        expect(forbidden.has(clockModel(scene.time).digital)).toBe(false);
      }
    for (const scene of SPOKEN_CLOCK_GAMES) expect(forbidden.has(scene.answer)).toBe(false);
  });
});
