import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MassStory } from '../src/ui/MassStory';

describe('Buk lesson scene', () => {
  it('uses a separate premium Buk and shows three premium weights, with no duplicate question', () => {
    const { container } = render(<MassStory taskId="kg-3" />);
    expect(screen.getByAltText('Бук — сова-помощник')).toHaveAttribute(
      'src',
      expect.stringContaining('buk/premium.webp'),
    );
    expect(container.querySelectorAll('.mass-object-weight img')).toHaveLength(3);
    expect(screen.queryByText(/Сколько граммов/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Скрыть' }));
    expect(container.querySelectorAll('.mass-object-weight')).toHaveLength(3);
    fireEvent.click(screen.getByRole('button', { name: 'Бук' }));
    expect(
      screen.getByRole('region', { name: 'Бук помогает с единицами массы' }),
    ).toBeInTheDocument();
  });
  it('keeps reference separate from the assisted hint', () => {
    const onHint = vi.fn();
    const { rerender } = render(
      <MassStory taskId="weighing" hint="Яблоки бывают разной массы." onHint={onHint} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Таблица' }));
    expect(screen.getByText('1 кг = 1 000 г')).toBeInTheDocument();
    expect(onHint).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Все единицы' }));
    expect(screen.getByRole('table', { name: 'Единицы массы' })).toHaveTextContent('1 ц = 100 кг');
    fireEvent.click(screen.getByRole('button', { name: 'Подсказка' }));
    expect(onHint).toHaveBeenCalledOnce();
    rerender(
      <MassStory taskId="weighing" hint="Яблоки бывают разной массы." hintOpen onHint={onHint} />,
    );
    expect(screen.getByText('Яблоки бывают разной массы.')).toBeInTheDocument();
    rerender(<MassStory taskId="weighing" correct={false} />);
    expect(screen.queryByText('Посмотри разбор ответа ниже.')).not.toBeInTheDocument();
  });
});
