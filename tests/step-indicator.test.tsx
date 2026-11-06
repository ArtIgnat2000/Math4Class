import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BUILTIN_PACKS } from '../src/content';
import { createSession, nextTask, submitAnswer } from '../src/engine/lesson';
import { Lesson } from '../src/ui/Lesson';
import { StepIndicator } from '../src/ui/StepIndicator';

describe('shared step indicator', () => {
  it('shows completed, current and remaining dots with an accessible label', () => {
    const { container } = render(<StepIndicator count={3} current={1} label="Задание 2 из 3" />);
    expect(screen.getByRole('img', { name: 'Задание 2 из 3' })).toBeVisible();
    const dots = container.querySelectorAll('i');
    expect(dots).toHaveLength(3);
    expect(dots[0]).toHaveClass('is-done');
    expect(dots[1]).toHaveClass('is-current');
    expect(dots[2]).not.toHaveClass('is-current', 'is-done');
    expect(container.textContent).toBe('');
  });

  it('shows a separate current dot for retry questions', () => {
    const topic = BUILTIN_PACKS[4].topics.find((item) => item.id === 'calendar-years-months')!;
    const numeric = topic.tasks.find((task) => task.type === 'number')!;
    const start = createSession({ ...topic, tasks: [numeric], lessonSize: 1 }, 4);
    const retry = nextTask(submitAnswer(start, '-999'))!;
    const { container } = render(
      <Lesson
        session={retry}
        topic={topic}
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        onNext={vi.fn()}
        onExit={vi.fn()}
      />,
    );
    const indicator = screen.getByRole('img', { name: 'Повторное задание 1 из 1' });
    expect(indicator.querySelectorAll('i')).toHaveLength(1);
    expect(indicator.querySelector('i')).toHaveClass('is-current');
    expect(container.querySelector('.task-card-top button')).toHaveAccessibleName(
      'Сохранить и выйти',
    );
  });
});
