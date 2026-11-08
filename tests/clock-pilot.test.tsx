import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ClockPilot } from '../src/ui/ClockPilot';
import { getPack } from '../src/content';
import { taskApproved } from '../src/content/approved';

describe('time of day lesson', () => {
  it('changes a model on all three steps, restores state after both games and only starts practice explicitly', async () => {
    const user = userEvent.setup();
    const start = vi.fn();
    render(<ClockPilot onPractice={start} />);
    expect(screen.getByText('04:00')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'После полудня' }));
    expect(screen.getByText('16:00')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Прочитай часы' }));
    await user.click(screen.getByRole('button', { name: '08:00' }));
    expect(screen.getByRole('status')).toHaveTextContent('Попробуй ещё');
    expect(screen.getByRole('status')).toHaveTextContent('прибавь 12');
    await user.click(screen.getByRole('button', { name: '20:00' }));
    expect(screen.getByRole('status')).toHaveTextContent('Верно!');
    expect(screen.getByRole('status')).toHaveTextContent('20:00');
    await user.click(screen.getByRole('button', { name: 'Подсказка' }));
    await user.click(screen.getByRole('button', { name: 'Заново' }));
    await user.click(screen.getByRole('button', { name: 'К объяснению' }));
    expect(screen.getByText('16:00')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Дальше' }));
    expect(screen.getByText('17:00')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Другой час' }));
    expect(screen.getByText('18:00')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Настрой часы' }));
    await user.click(screen.getByRole('button', { name: 'Проверить часы' }));
    expect(screen.getByRole('status')).toHaveTextContent('Попробуй ещё');
    expect(screen.getByRole('status')).toHaveTextContent('короткую стрелку');
    await user.click(
      within(screen.getByRole('group', { name: 'Час на циферблате' })).getByRole('button', {
        name: '5',
      }),
    );
    await user.click(screen.getByRole('button', { name: 'После полудня' }));
    await user.click(screen.getByRole('button', { name: 'Проверить часы' }));
    expect(screen.getByRole('status')).toHaveTextContent('Верно!');
    expect(screen.getByRole('status')).toHaveTextContent('17:00');
    await user.click(screen.getByRole('button', { name: 'К объяснению' }));
    expect(screen.getByText('18:00')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Дальше' }));
    expect(screen.getByText('06:10')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Другие минуты' }));
    expect(screen.getByText('06:20')).toBeVisible();
    expect(start).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Проверить себя' }));
    expect(start).toHaveBeenCalledOnce();
  });
  it('does not expose a checked elapsed-time answer in theory, games or reference', async () => {
    const user = userEvent.setup();
    const { container } = render(<ClockPilot onPractice={() => {}} />);
    const noAnswer = () => {
      const accessible = [
        container.textContent,
        ...Array.from(container.querySelectorAll('[aria-label]'), (el) =>
          el.getAttribute('aria-label'),
        ),
      ].join(' ');
      expect(accessible).not.toMatch(
        /(?:02:00|09:00|15:00|2 часа от начала суток|9 часов от начала суток|15 часов от начала суток)/,
      );
    };
    for (let step = 0; step < 3; step++) {
      noAnswer();
      await user.click(screen.getByRole('button', { name: 'О часах' }));
      noAnswer();
      await user.click(screen.getByRole('button', { name: 'О часах' }));
      await user.click(screen.getByRole('button', { name: 'Прочитай часы' }));
      await user.click(screen.getByRole('button', { name: 'Подсказка' }));
      noAnswer();
      await user.click(screen.getByRole('button', { name: '20:00' }));
      noAnswer();
      await user.click(screen.getByRole('button', { name: 'К объяснению' }));
      await user.click(screen.getByRole('button', { name: 'Настрой часы' }));
      await user.click(screen.getByRole('button', { name: 'Подсказка' }));
      noAnswer();
      await user.click(screen.getByRole('button', { name: 'Проверить часы' }));
      noAnswer();
      await user.click(screen.getByRole('button', { name: 'К объяснению' }));
      const change = ['После полудня', 'Другой час', 'Другие минуты'][step];
      await user.click(screen.getByRole('button', { name: change }));
      noAnswer();
      if (step < 2) await user.click(screen.getByRole('button', { name: 'Дальше' }));
    }
  });
  it('offers additional rounds, resets and shows elapsed and remaining minutes', async () => {
    const user = userEvent.setup();
    render(<ClockPilot onPractice={() => {}} />);
    await user.click(screen.getByRole('button', { name: 'Прочитай часы' }));
    for (const answer of ['20:00', '22:00', '23:00', '19:00']) {
      await user.click(screen.getByRole('button', { name: answer }));
      expect(screen.getByRole('status')).toHaveTextContent('Верно!');
      if (answer !== '19:00')
        await user.click(screen.getByRole('button', { name: 'Следующие часы' }));
    }
    await user.click(screen.getByRole('button', { name: 'Играть снова' }));
    expect(screen.getByRole('button', { name: '20:00' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'К объяснению' }));
    await user.click(screen.getByRole('button', { name: 'Настрой часы' }));
    for (const [target, hour] of [
      ['17:00', '5'],
      ['18:00', '6'],
      ['19:00', '7'],
      ['22:00', '10'],
      ['23:00', '11'],
    ]) {
      expect(screen.getByText(new RegExp(`Настрой часы на ${target}`))).toBeVisible();
      await user.click(
        within(screen.getByRole('group', { name: 'Час на циферблате' })).getByRole('button', {
          name: new RegExp(`^${hour}$`),
        }),
      );
      await user.click(screen.getByRole('button', { name: 'После полудня' }));
      await user.click(screen.getByRole('button', { name: 'Проверить часы' }));
      expect(screen.getByRole('status')).toHaveTextContent('Верно!');
      if (target !== '23:00')
        await user.click(screen.getByRole('button', { name: 'Следующие часы' }));
    }
    expect(screen.getByRole('button', { name: 'Играть снова' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'К объяснению' }));
    await user.click(screen.getByRole('button', { name: 'Дальше' }));
    for (const time of ['18:00', '19:00', '20:00']) {
      await user.click(screen.getByRole('button', { name: 'Другой час' }));
      expect(screen.getByText(time)).toBeVisible();
    }
    await user.click(screen.getByRole('button', { name: 'Дальше' }));
    expect(screen.getByRole('status')).toHaveTextContent('прошло 10 мин');
    await user.click(screen.getByRole('button', { name: 'Осталось' }));
    expect(screen.getByRole('status')).toHaveTextContent('осталось 50 мин');
    for (const time of ['06:20', '06:30', '06:40']) {
      await user.click(screen.getByRole('button', { name: 'Другие минуты' }));
      expect(screen.getByText(time)).toBeVisible();
    }
    expect(screen.getByRole('status')).toHaveTextContent('осталось 20 мин');
  });
  it('releases only the three verified parts of exercise 230 and closes an edited task', () => {
    const topic = getPack(4, []).topics.find((t) => t.id === 'clock-day-hours')!;
    expect(topic.reference?.pages).toEqual([48]);
    expect(topic.tasks.map((t) => t.answer)).toEqual([2, 9, 15]);
    for (const task of topic.tasks) {
      expect(taskApproved(4, topic.id, task)).toBe(true);
      expect(taskApproved(4, topic.id, { ...task, question: `${task.question} Изменено.` })).toBe(
        false,
      );
    }
  });
});
