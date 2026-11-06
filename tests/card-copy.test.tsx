import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppProvider } from '../src/state/AppContext';
import { BUILTIN_PACKS } from '../src/content';
import { createSession, submitAnswer } from '../src/engine/lesson';
import { Catalog } from '../src/ui/Learning';
import { Lesson } from '../src/ui/Lesson';
import { YearBuildGame } from '../src/ui/YearBuildGame';
import { YearMonthsPilot } from '../src/ui/YearMonthsPilot';

describe('compact card copy', () => {
  it('topic cards keep the title and action, without a description or lesson metadata', () => {
    const { container } = render(
      <AppProvider>
        <Catalog onOpen={vi.fn()} />
      </AppProvider>,
    );
    const cards = container.querySelectorAll('.topic-card');
    expect(cards.length).toBeGreaterThan(0);
    expect(container.querySelectorAll('.topic-description')).toHaveLength(0);
    expect(container.querySelectorAll('.task-count')).toHaveLength(0);
    expect(container.querySelectorAll('.topic-number')).toHaveLength(0);
    expect(
      screen.getByRole('button', { name: /Уравнения: сложение и вычитание/ }),
    ).toBeInTheDocument();
  });

  it('year cards show the unit once instead of repeating the same twelve months', () => {
    const { container } = render(<YearMonthsPilot onPractice={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Дальше' }));
    const cards = container.querySelectorAll('.year-group-card');
    expect(cards.length).toBeGreaterThan(0);
    for (const card of cards) {
      expect(card.textContent).toContain('12');
      expect(card.textContent).toContain('мес.');
      expect(card.textContent).not.toContain('12 месяцев');
    }
    expect(container.querySelector('.pilot-meaning')).toBeNull();
    expect(container.querySelector('.pilot-example-note')).toBeNull();
    expect(screen.queryByText(/Авторское|Авторская/)).not.toBeInTheDocument();
    expect(container.querySelector('.pilot-steps')).toHaveAttribute('aria-label', 'Шаг 2 из 3');
    expect(container.querySelector('.pilot-step')).toBeNull();
  });

  it('the explanation header keeps a single visible line of text', () => {
    const { container } = render(<YearMonthsPilot onPractice={vi.fn()} />);
    for (const step of [0, 1, 2]) {
      // Only the dialog title stays visible; the step name and the instruction
      // remain available to assistive technology instead of stacking up lines.
      expect(container.querySelector('.year-month-pilot-v2 h3')).toHaveClass('sr-only');
      expect(container.querySelector('.pilot-instruction')).toHaveClass('sr-only');
      const toggle = screen.getByRole('button', { name: 'Времена года' });
      expect(toggle).toHaveTextContent('');
      expect(toggle).toHaveAttribute('title', 'Времена года');
      expect(container.querySelector('.pilot-topline')!.textContent).toBe('');
      if (step < 2) fireEvent.click(screen.getByRole('button', { name: 'Дальше' }));
    }
  });

  it('the game keeps one visible counter and short tray/origin labels', () => {
    const { container } = render(<YearBuildGame onExit={vi.fn()} />);
    expect(container.querySelector('.year-game-progress')).toBeNull();
    expect(container.querySelector('.year-game-count')).toBeNull();
    expect(container.querySelector('.year-clock-center strong')).toHaveTextContent('0');
    expect(screen.getByText('Месяцы')).toBeInTheDocument();
    expect(screen.queryByText(/Авторское|Авторская/)).not.toBeInTheDocument();
    // The lead moved out of the header; the status line names both input paths.
    expect(container.querySelector('.year-game-lead')).toHaveClass('sr-only');
    expect(container.querySelector('.year-game h3')).toHaveClass('sr-only');
    expect(screen.getByRole('status')).toHaveTextContent('Перетащи или нажми: месяц → место.');
  });

  it('task cards keep the exact approved question and only show a breakdown when it is needed', () => {
    const topic = BUILTIN_PACKS[4].topics.find((item) => item.id === 'calendar-years-months')!;
    const task = topic.tasks.find((item) => item.id === 'four-years')!;
    const session = createSession({ ...topic, tasks: [task] }, 4);
    const correct = submitAnswer(session, '48');
    const first = render(
      <Lesson
        session={correct}
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        onNext={vi.fn()}
        onExit={vi.fn()}
      />,
    );
    expect(screen.getByRole('heading', { name: task.question })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Верно!');
    expect(screen.getByRole('status').querySelector('p')).toBeNull();
    first.unmount();

    const wrong = submitAnswer(session, '1');
    render(
      <Lesson
        session={wrong}
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        onNext={vi.fn()}
        onExit={vi.fn()}
      />,
    );
    const feedback = screen.getByRole('status');
    expect(feedback).toHaveTextContent('Разберёмся.');
    expect(feedback).toHaveTextContent(`Ответ: 48`);
    expect(feedback).toHaveTextContent(task.explanation);
    expect(feedback.textContent).not.toContain('Это задание ещё встретится');
    expect(within(feedback).queryByText(/Отличная работа/)).toBeNull();
  });
});
