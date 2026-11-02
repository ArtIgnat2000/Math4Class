import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MassStory } from '../src/ui/MassStory';

describe('pilot story for kilograms and grams', () => {
  it('shows an exact, countable model without revealing the task answer', () => {
    const { container } = render(<MassStory taskId="kg-3" />);
    expect(screen.getByText(/Слон собирает три больших гири/)).toBeInTheDocument();
    expect(container.querySelectorAll('.mass-story-weight')).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: /Показать: сколько гирек/ }));
    expect(container.querySelectorAll('.mass-story-weight')).toHaveLength(10);
    expect(screen.getByText('10 × 100 г = 1 000 г = 1 кг')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Пропустить сцену' }));
    expect(screen.queryByText('10 × 100 г = 1 000 г = 1 кг')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Вернуться к истории Слона/ }));
    expect(screen.getByRole('region', { name: 'История Слона и гирек' })).toBeInTheDocument();
  });
  it('changes dialogue after feedback without punishing a mistake', () => {
    const { rerender } = render(<MassStory taskId="mixed-2-350" correct={false} />);
    expect(screen.getByText(/Не страшно ошибиться/)).toBeInTheDocument();
    rerender(<MassStory taskId="mixed-2-350" correct={true} />);
    expect(screen.getByText(/Слон радуется/)).toBeInTheDocument();
  });
});
