import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MassIntroVisual } from '../src/ui/MassIntroVisual';

describe('visual introduction to kilograms and grams', () => {
  it('shows that kilo means one thousand with distinct gram and kilogram objects', () => {
    const { container } = render(<MassIntroVisual />);
    expect(container.querySelector('.kilo-gram img')).toHaveAttribute(
      'src',
      expect.stringContaining('gram-weight.webp'),
    );
    expect(container.querySelector('.kilo-kilogram img')).toHaveAttribute(
      'src',
      expect.stringContaining('weight.webp'),
    );
    expect(screen.getByText('кило')).toBeInTheDocument();
    expect(screen.getByText('1 кг = 1 000 г')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Что значит «кило»?' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
  it('switches to a different illustrated example without spoiling the 2 kg 350 g task', () => {
    const { container } = render(<MassIntroVisual />);
    fireEvent.click(screen.getByRole('button', { name: 'Кг вместе с г' }));
    expect(container.querySelectorAll('.mass-object-weight')).toHaveLength(1);
    expect(container.querySelectorAll('.mass-object-parcel')).toHaveLength(1);
    expect(screen.getByText('1 000 г + 200 г = 1 200 г')).toBeInTheDocument();
    expect(screen.queryByText(/2 кг 350 г/)).not.toBeInTheDocument();
  });
});
