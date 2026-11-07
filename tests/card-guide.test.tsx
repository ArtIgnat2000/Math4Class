import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BUILTIN_PACKS } from '../src/content';
import { createSession } from '../src/engine/lesson';
import { Lesson, TopicDialog } from '../src/ui/Lesson';
import { RomanNumeralsPilot } from '../src/ui/RomanNumeralsPilot';
import { YearMonthsPilot } from '../src/ui/YearMonthsPilot';

const topics = BUILTIN_PACKS[4].topics;

describe('card purpose and interface help', () => {
  it('explains the current step and distinguishes the unscored game', () => {
    render(<RomanNumeralsPilot onPractice={vi.fn()} />);
    expect(screen.getByText('Теория')).toBeVisible();
    const help = screen.getByRole('button', { name: 'Справка' });
    expect(help).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(help);
    expect(help).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/Нажми знак и посмотри/)).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Дальше' }));
    expect(screen.getByText(/Перетаскивай, добавляй и переставляй знаки/)).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Игра «Собери число»' }));
    expect(screen.getByText('Тренажёр')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Справка' }));
    expect(screen.getByText(/Знаки можно переставлять и убирать/)).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'К объяснению' }));
    expect(screen.getByText('Теория')).toBeVisible();
  });

  it('describes the year game separately', () => {
    render(<YearMonthsPilot onPractice={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Играть — игра «Собери год»' }));
    expect(screen.getByText('Тренажёр')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Справка' }));
    expect(screen.getByText(/Расставь месяцы по порядку/)).toBeVisible();
  });

  it('keeps the answer and does not mark interface help as assisted', () => {
    const topic = topics.find((item) => item.id === 'calendar-years-months')!;
    const session = createSession({ ...topic, tasks: [topic.tasks[0]] }, 4);
    const onChange = vi.fn();
    render(
      <Lesson
        session={session}
        topic={topic}
        onChange={onChange}
        onSubmit={vi.fn()}
        onNext={vi.fn()}
        onExit={vi.fn()}
      />,
    );
    expect(screen.getByText('Практика')).toBeVisible();
    const answer = screen.getByLabelText('Твой ответ');
    fireEvent.change(answer, { target: { value: '4' } });
    fireEvent.click(screen.getByRole('button', { name: 'Справка' }));
    expect(screen.getByText(/Реши задание, введи число/)).toBeVisible();
    expect(answer).toHaveValue('4');
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByText('48 месяцев')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Справка' }));
    expect(screen.getByRole('button', { name: 'Справка' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('also labels ordinary theory cards', () => {
    const topic = {
      ...topics.find((item) => item.id === 'multiply-divide-powers-ten')!,
      id: 'ordinary-theory-fixture',
    };
    render(
      <TopicDialog topic={topic} isDemo={false} mode="learn" onClose={vi.fn()} onStart={vi.fn()} />,
    );
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Теория')).toBeVisible();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Справка' }));
    expect(within(dialog).getByText(/Изучи правило/)).toBeVisible();
  });
});
