import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MassStory } from '../src/ui/MassStory';

describe('pilot story for kilograms and grams', () => {
  it('shows an exact, countable model without revealing the task answer', () => {
    const { container } = render(<MassStory taskId="kg-3" />);
    expect(screen.getByText(/У Бука три гири/)).toBeInTheDocument();
    expect(screen.getByAltText('Бук — сова-помощник из проекта «Слово»')).toHaveAttribute(
      'src',
      expect.stringContaining('/illustrations/buk/face.webp'),
    );
    expect(container.querySelector('img')?.getAttribute('src')).not.toContain('mass-characters');
    expect(container.querySelectorAll('.mass-story-weight')).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: 'Бук: справка о массе' }));
    fireEvent.click(screen.getByRole('button', { name: /Показать десять гирек/ }));
    expect(container.querySelectorAll('.mass-story-weight')).toHaveLength(10);
    expect(screen.getByText('10 × 100 г = 1 000 г = 1 кг')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Скрыть Бука' }));
    expect(screen.queryByText('10 × 100 г = 1 000 г = 1 кг')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Показать Бука и справку' }));
    expect(
      screen.getByRole('region', { name: 'Бук помогает с единицами массы' }),
    ).toBeInTheDocument();
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
    ['kg-3', 'Каждая гиря весит 1 кг'],
    ['mixed-2-350', 'пакет 350 г'],
    ['g-7000', 'Груз весит 7 000 г'],
    ['weighing', 'не зная массу каждого'],
  ])('%s has an unambiguous prompt', (taskId, phrase) => {
    const { unmount } = render(<MassStory taskId={taskId} />);
    expect(screen.getByText(new RegExp(phrase))).toBeInTheDocument();
    unmount();
  });
});

describe('Buk reference and hint are distinct', () => {
  it('offers an optional full table without requesting a hint', () => {
    const onHint = vi.fn();
    render(<MassStory taskId="kg-3" hint="В 1 кг — 1 000 г." onHint={onHint} />);
    fireEvent.click(screen.getByRole('button', { name: 'Бук: справка о массе' }));
    expect(screen.getByText('1 кг = 1 000 г')).toBeInTheDocument();
    expect(onHint).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Вся таблица единиц массы' }));
    expect(screen.getByRole('table', { name: 'Единицы массы' })).toHaveTextContent('1 ц = 100 кг');
    fireEvent.click(screen.getByRole('button', { name: 'Бук: подсказка к вопросу' }));
    expect(onHint).toHaveBeenCalledOnce();
  });
});
