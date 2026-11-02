import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { CentnerIntroVisual } from '../src/ui/CentnerIntroVisual';

describe('centner introduction', () => {
  it('introduces a centner as 100 kg without implying a person weighs 100 kg', () => {
    const { container } = render(<CentnerIntroVisual />);
    expect(container.querySelectorAll('.centner-example img')).toHaveLength(1);
    expect(screen.getByText('1 ц = 100 кг')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /один груз массой один центнер/i })).toBeInTheDocument();
    expect(screen.queryByText(/спортсмен|атлет/i)).not.toBeInTheDocument();
  });
  it('counts exactly ten centner crates in a tonne', () => {
    const { container } = render(<CentnerIntroVisual />);
    fireEvent.click(screen.getByRole('button', { name: 'А тонна?' }));
    expect(container.querySelectorAll('.centner-ten img')).toHaveLength(10);
    expect(screen.getByText('10 ц = 1 т = 1 000 кг')).toBeInTheDocument();
  });
});
