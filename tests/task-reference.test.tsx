import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BUILTIN_PACKS } from '../src/content';
import { createSession } from '../src/engine/lesson';
import { Lesson, safeTheoryExample } from '../src/ui/Lesson';

const topics = BUILTIN_PACKS[4].topics;
const calendar = topics.find((topic) => topic.id === 'calendar-years-months')!;

describe('explanation reachable from a task card', () => {
  it('withholds a worked example that already solves a task in the same topic', () => {
    const withheld = topics
      .filter((topic) => safeTheoryExample(topic) === null)
      .map((topic) => topic.id);
    expect(withheld).toEqual(
      expect.arrayContaining([
        'equations-add-subtract',
        'division-restore-dividend',
        'area-equal-parts',
      ]),
    );
    expect(safeTheoryExample(calendar)).toBe(calendar.theory.example);
    for (const topic of topics) {
      const example = safeTheoryExample(topic);
      if (!example) continue;
      const numbers = new Set(example.match(/\d+/g) ?? []);
      for (const task of topic.tasks) {
        if (typeof task.answer === 'number') expect(numbers.has(String(task.answer))).toBe(false);
      }
    }
  });

  it('opens the model, keeps the typed answer and never shows the approved total', () => {
    const session = createSession({ ...calendar, tasks: [calendar.tasks[0]] }, 4);
    const onChange = vi.fn();
    const { container } = render(
      <Lesson
        session={session}
        topic={calendar}
        onChange={onChange}
        onSubmit={vi.fn()}
        onNext={vi.fn()}
        onExit={vi.fn()}
      />,
    );
    expect(container.querySelector('.numeric-keypad')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Объяснение' }));
    expect(onChange).toHaveBeenCalledExactlyOnceWith({ ...session, hintOpen: true });
    expect(screen.getByRole('group', { name: 'Игры' })).toBeInTheDocument();
    expect(screen.queryByText(/48 месяцев|27 месяцев/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Считай — игра «Считаем месяцы»' }));
    expect(screen.getByRole('heading', { name: 'Считаем месяцы' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '12' }));
    fireEvent.click(screen.getByRole('button', { name: 'Дальше' }));
    fireEvent.click(screen.getByRole('button', { name: '25' }));
    expect(screen.queryByText(/48 месяцев|27 месяцев/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'К объяснению' }));
    fireEvent.click(screen.getByRole('button', { name: 'К заданию' }));
    expect(container.querySelector('.task-card')).not.toBeNull();
    expect(screen.queryByRole('group', { name: 'Игры' })).not.toBeInTheDocument();
  });
});
