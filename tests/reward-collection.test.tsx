import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppProvider } from '../src/state/AppContext';
import { Rewards } from '../src/ui/Progress';
import { Result } from '../src/ui/Lesson';
import { createAppData, type LessonResult } from '../src/engine/model';
import { STORAGE_KEY } from '../src/state/storage';
import { REWARD_ITEMS, rewardsForLesson, rewardsByShelf } from '../src/engine/rewards';

function seedLessons(lessons: number) {
  const data = createAppData();
  data.profiles[0].totals = {
    tasks: lessons * 5,
    correct: lessons * 4,
    lessons,
    xp: lessons * 30,
    recovered: 0,
    perfect: 0,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function renderRewards(lessons: number) {
  seedLessons(lessons);
  return render(
    <AppProvider>
      <Rewards />
    </AppProvider>,
  );
}

describe('скины и вещи на странице наград', () => {
  it('показывает всю коллекцию и отмечает открытые вещи', () => {
    const { container } = renderRewards(5);
    expect(screen.getByRole('heading', { name: 'Скины и вещи' })).toBeInTheDocument();
    expect(screen.getByText('5 из 102')).toBeInTheDocument();
    expect(container.querySelectorAll('.collection-card')).toHaveLength(REWARD_ITEMS.length);
    expect(container.querySelectorAll('.collection-card.unlocked')).toHaveLength(5);
    expect(container.querySelectorAll('.collection-card.locked')).toHaveLength(
      REWARD_ITEMS.length - 5,
    );
    expect(screen.getAllByText('Открыто')).toHaveLength(5);
    expect(container.textContent).toContain('Бонус на 6-м занятии');
    expect(container.textContent).toContain('Осталось 1 занятие');
  });

  it('фильтрует полки и сообщает о состоянии кнопками', () => {
    const { container } = renderRewards(5);
    const shelf = screen.getByRole('button', { name: /Питомцы/ });
    fireEvent.click(shelf);
    expect(shelf).toHaveAttribute('aria-pressed', 'true');
    expect(container.querySelectorAll('.collection-card')).toHaveLength(
      rewardsByShelf('pet').length,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Все' }));
    expect(container.querySelectorAll('.collection-card')).toHaveLength(REWARD_ITEMS.length);
  });

  it('на старте объясняет, что делать, а не показывает пустую полку', () => {
    const { container } = renderRewards(0);
    expect(screen.getByText('0 из 102')).toBeInTheDocument();
    expect(container.querySelectorAll('.collection-card.unlocked')).toHaveLength(0);
    expect(container.textContent).toContain('Бонус на 1-м занятии');
    expect(container.textContent).toContain('Пройдено 0 занятий');
  });

  it('на собранной коллекции показывает итог без следующего набора', () => {
    const { container } = renderRewards(200);
    expect(screen.getByText('102 из 102')).toBeInTheDocument();
    expect(container.textContent).toContain('Коллекция собрана полностью');
    expect(container.querySelectorAll('.collection-card.unlocked')).toHaveLength(
      REWARD_ITEMS.length,
    );
  });
});

describe('бонус на экране завершения занятия', () => {
  const result: LessonResult = {
    id: 'r1',
    topicId: 't1',
    topicTitle: 'Уравнения',
    grade: 4,
    day: '2026-11-02',
    correct: 3,
    total: 3,
    assisted: 0,
    recovered: 0,
    xp: 30,
    stars: 3,
    mode: 'learn',
  };

  it('показывает превью новой награды и открывает крупную картинку', () => {
    render(
      <Result
        result={result}
        hasTopics
        bonus={{ lesson: 12, items: rewardsForLesson(12) }}
        onNext={vi.fn()}
        onHome={vi.fn()}
        onTopics={vi.fn()}
      />,
    );
    const item = rewardsForLesson(12)[0];
    const reward = screen.getByRole('region', { name: 'Твоя новая награда' });
    const card = within(reward).getByRole('button', {
      name: `Рассмотреть награду «${item.title}»`,
    });
    expect(card.querySelector('img')?.getAttribute('src')).toContain(`/rewards/${item.id}.webp`);

    fireEvent.click(card);
    const dialog = screen.getByRole('dialog', { name: item.title });
    expect(dialog.querySelector('.reward-modal-art')?.getAttribute('src')).toContain(
      `/rewards/${item.id}.webp`,
    );
    expect(dialog).toHaveTextContent('Открылась за 12-е занятие');

    fireEvent.click(within(dialog).getByRole('button', { name: 'Продолжить' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('не обещает бонус, если на этом занятии его нет', () => {
    render(
      <Result
        result={result}
        hasTopics
        bonus={{ lesson: 21, items: rewardsForLesson(21) }}
        onNext={vi.fn()}
        onHome={vi.fn()}
        onTopics={vi.fn()}
      />,
    );
    expect(screen.queryByRole('region', { name: /награда/ })).not.toBeInTheDocument();
  });
});
