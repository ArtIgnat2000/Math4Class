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
  spokenMinuteChoices,
  spokenWordOptions,
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
    expect(SPOKEN_CLOCK_SCENES.map((row) => row.length)).toEqual([6, 5, 6]);
    expect(SPOKEN_CLOCK_GAMES).toHaveLength(11);
    for (const scene of SPOKEN_CLOCK_GAMES) {
      expect(clockModel(scene.time).digital).toBe(scene.answer);
      expect(scene.options).toContain(scene.answer);
      expect(new Set(scene.options).size).toBe(3);
      expect(spokenMinuteChoices(scene.time.minute)).toHaveLength(3);
      expect(spokenMinuteChoices(scene.time.minute)).toContain(scene.time.minute);
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
    for (const answer of SPOKEN_CLOCK_GAMES.slice(1).map((scene) => scene.answer)) {
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
  it('cycles through all examples, explains the next hour and offers two names for each time', async () => {
    const user = userEvent.setup();
    render(<SpokenClockPilot onPractice={() => {}} />);
    for (let step = 0; step < 3; step++) {
      const scenes = SPOKEN_CLOCK_SCENES[step];
      for (const scene of scenes) {
        expect(screen.getByText(scene.words, { exact: true })).toBeVisible();
        expect(screen.getByText(`или ${scene.also}`)).toBeVisible();
        expect(screen.getByText(scene.insight)).toBeVisible();
        expect(screen.getByRole('status')).toHaveTextContent(clockModel(scene.time).digital);
        expect(screen.getByRole('img', { name: new RegExp(scene.explanation) })).toBeVisible();
        await user.click(screen.getByRole('button', { name: 'Другой пример' }));
      }
      expect(screen.getByText(scenes[0].words, { exact: true })).toBeVisible();
      if (step < 2) await user.click(screen.getByRole('button', { name: 'Дальше' }));
    }
  });
  it('trains naming the hands in reverse, gives feedback and returns to the example', async () => {
    const user = userEvent.setup();
    render(<SpokenClockPilot onPractice={() => {}} />);
    await user.click(screen.getByRole('button', { name: 'Другой пример' }));
    const selected = SPOKEN_CLOCK_SCENES[0][1];
    await user.click(screen.getByRole('button', { name: 'Назови словами' }));
    for (const [index, scene] of SPOKEN_CLOCK_GAMES.entries()) {
      const choices = spokenWordOptions(index);
      expect(new Set(choices).size).toBe(3);
      expect(choices).toContain(scene.words);
      expect(screen.getByRole('img', { name: /длинная показывает/ })).toBeVisible();
      if (index === 0) {
        await user.click(
          screen.getByRole('button', { name: choices.find((word) => word !== scene.words)! }),
        );
        expect(screen.getByRole('status')).toHaveTextContent('Попробуй ещё');
        await user.click(screen.getByRole('button', { name: 'Подсказка' }));
        expect(screen.getByText(scene.explanation, { exact: false })).toBeVisible();
      }
      await user.click(screen.getByRole('button', { name: scene.words }));
      expect(screen.getByRole('status')).toHaveTextContent('Верно!');
      if (index < SPOKEN_CLOCK_GAMES.length - 1)
        await user.click(screen.getByRole('button', { name: 'Следующее время' }));
    }
    expect(screen.getByRole('button', { name: 'Играть снова' })).toBeVisible();
    expect(localStorage.length).toBe(0);
    await user.click(screen.getByRole('button', { name: 'К объяснению' }));
    expect(screen.getByText(selected.words, { exact: true })).toBeVisible();
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
    const forbiddenWords = ['четверть пятого', 'половина первого', 'без четверти семь'];
    for (const scene of SPOKEN_CLOCK_GAMES) {
      expect(forbidden.has(scene.answer)).toBe(false);
      expect(scene.options.some((option) => forbidden.has(option))).toBe(false);
      expect(forbiddenWords).not.toContain(scene.words);
      for (const minute of spokenMinuteChoices(scene.time.minute)) {
        expect(forbidden.has(clockModel({ hour: scene.time.hour, minute }).digital)).toBe(false);
      }
    }
  });
});
