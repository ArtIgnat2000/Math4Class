import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { BUILTIN_PACKS, getPack } from '../src/content';
import { isAuthorTask, taskApproved } from '../src/content/approved';
import { TimeUnitsTable } from '../src/ui/TimeUnitsTable';
import { TopicDialog } from '../src/ui/Lesson';

describe('time-units table topic', () => {
  it('shows the reference table before starting the lesson', async () => {
    const topic = BUILTIN_PACKS[4].topics.find((item) => item.id === 'time-units-table')!;
    render(
      <TopicDialog
        topic={topic}
        isDemo={false}
        mode="learn"
        onClose={() => undefined}
        onStart={() => undefined}
      />,
    );
    expect(
      screen.queryByRole('heading', { name: 'Таблица единиц времени', level: 3 }),
    ).not.toBeInTheDocument();
    const unitPictures = document.querySelectorAll('.time-units-figure img');
    expect(unitPictures).toHaveLength(7);
    expect([...unitPictures].map((image) => image.getAttribute('src'))).toEqual(
      expect.arrayContaining([
        `${import.meta.env.BASE_URL}illustrations/time-unit-century.webp`,
        `${import.meta.env.BASE_URL}illustrations/time-unit-year.webp`,
        `${import.meta.env.BASE_URL}illustrations/time-unit-month.webp`,
        `${import.meta.env.BASE_URL}illustrations/time-unit-day.webp`,
        `${import.meta.env.BASE_URL}illustrations/time-unit-hour.webp`,
        `${import.meta.env.BASE_URL}illustrations/time-unit-minute.webp`,
        `${import.meta.env.BASE_URL}illustrations/time-unit-second.webp`,
      ]),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Справка' }));
    expect(screen.getByText(/открыть её крупнее/)).toBeVisible();
    expect(screen.getByRole('button', { name: 'Начать занятие' })).toBeInTheDocument();
  });
  it('shows concise relations and expandable explanations for each time unit', async () => {
    render(<TimeUnitsTable />);
    const table = screen.getByRole('table', { name: 'Соотношения между единицами времени' });
    const rows = within(table).getAllByRole('row');
    expect(rows).toHaveLength(7);
    expect(table).toHaveTextContent('1 век = 100 лет');
    expect(table).toHaveTextContent('1 год = 12 месяцев');
    expect(table).toHaveTextContent('30 или 31 сутки');
    expect(document.querySelector('#time-unit-detail-year')).toHaveAttribute('hidden');
    expect(document.querySelector('#time-unit-detail-month')).toHaveAttribute('hidden');
    expect(table).toHaveTextContent('1 сутки = 24 часа');
    expect(table).toHaveTextContent('1 час = 60 минут');
    expect(table).toHaveTextContent('1 минута = 60 секунд');
    expect(table).toHaveTextContent('Секунда');

    const yearToggle = screen.getByRole('button', { name: 'Показать пояснение: Год' });
    await userEvent.click(yearToggle);
    expect(yearToggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/в нём 365 суток, а в високосном году — 366/)).toBeVisible();
    expect(document.querySelector('#time-unit-detail-year')).not.toHaveAttribute('hidden');

    await userEvent.click(screen.getByRole('button', { name: 'Показать пояснение: Секунда' }));
    expect(screen.getByText(/Секундомер помогает отмерять секунды/)).toBeVisible();
    expect(document.querySelector('#time-unit-detail-year')).toHaveAttribute('hidden');
  });

  it('keeps textbook-checked questions distinct from the five approved additions', () => {
    const topic = BUILTIN_PACKS[4].topics.find((item) => item.id === 'time-units-table')!;
    expect(getPack(4, []).topics.some((item) => item.id === topic.id)).toBe(true);
    expect(topic.reference?.pages).toEqual([51]);
    expect(topic.tasks).toHaveLength(8);
    expect(topic.tasks.filter((task) => !isAuthorTask(topic.id, task.id))).toHaveLength(3);
    expect(topic.tasks.filter((task) => isAuthorTask(topic.id, task.id))).toHaveLength(5);
    for (const task of topic.tasks) expect(taskApproved(4, topic.id, task)).toBe(true);
    expect(topic.tasks.find((task) => task.id === 'stride-distance')).toMatchObject({
      type: 'number',
      answer: 480,
      unit: 'м',
    });
    expect(topic.tasks.find((task) => task.id === 'doctor-alarm')).toMatchObject({
      type: 'number',
      answer: 13,
      unit: 'ч',
    });
  });
});
