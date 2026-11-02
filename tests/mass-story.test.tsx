import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MassStory } from '../src/ui/MassStory';

describe('pilot story for kilograms and grams', () => {
  it('shows an exact, countable model without revealing the task answer', () => {
    const { container } = render(<MassStory taskId="kg-3" />);
    expect(screen.getByText(/У Бука три такие гири/)).toBeInTheDocument();
    expect(screen.getByAltText('Бук — сова-помощник из проекта «Слово»')).toHaveAttribute(
      'src',
      expect.stringContaining('/illustrations/buk/face.webp'),
    );
    expect(container.querySelector('img')?.getAttribute('src')).not.toContain('mass-characters');
    expect(container.querySelectorAll('.mass-story-weight')).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: /Показать 10 гирек/ }));
    expect(container.querySelectorAll('.mass-story-weight')).toHaveLength(10);
    expect(screen.getByText('10 × 100 г = 1 000 г = 1 кг')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Пропустить сцену' }));
    expect(screen.queryByText('10 × 100 г = 1 000 г = 1 кг')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Вернуться к истории Бука/ }));
    expect(screen.getByRole('region', { name: 'История Бука и гирек' })).toBeInTheDocument();
  });
  it('changes dialogue after feedback without punishing a mistake', () => {
    const { rerender } = render(
      <MassStory taskId="mixed-2-350" correct={false} hint="Переведи 2 кг в граммы." />,
    );
    expect(screen.getByText(/Переведи 2 кг в граммы/)).toBeInTheDocument();
    rerender(<MassStory taskId="mixed-2-350" correct={true} />);
    expect(screen.getByText(/Бук радуется/)).toBeInTheDocument();
  });
});

describe('story wording matches the task', () => {
  it.each([
    ['kg-3', 'Каждая большая гиря весит 1 кг'],
    ['mixed-2-350', 'пакет крупы массой 350 г'],
    ['g-7000', 'груз массой 7 000 г'],
    ['weighing', 'масса каждого яблока неизвестна'],
  ])('%s has an unambiguous prompt', (taskId, phrase) => {
    const { unmount } = render(<MassStory taskId={taskId} />);
    expect(screen.getByText(new RegExp(phrase))).toBeInTheDocument();
    unmount();
  });
});
