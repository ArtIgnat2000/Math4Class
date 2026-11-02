import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MassIntroVisual } from '../src/ui/MassIntroVisual';

describe('visual introduction to kilograms and grams', () => {
  it('shows 1 kg as ten smaller 100 g weights, without a paragraph', () => {
    const { container } = render(<MassIntroVisual />);
    expect(container.querySelectorAll('.mass-intro-ten .mass-object-weight')).toHaveLength(10);
    expect(
      container.querySelector('.mass-intro-equation > .mass-object-weight img'),
    ).toHaveAttribute('src', expect.stringContaining('weight.webp'));
    for (const image of container.querySelectorAll('.mass-intro-ten img')) {
      expect(image).toHaveAttribute('src', expect.stringContaining('weight-100g.webp'));
    }
    expect(screen.getAllByText('100 г')).toHaveLength(10);
    expect(screen.getByText('1 кг = 1 000 г')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1 кг — это сколько?' })).toHaveAttribute(
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
