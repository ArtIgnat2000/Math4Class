import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { CentnerIntroVisual } from '../src/ui/CentnerIntroVisual';

describe('centner introduction', () => {
  it('introduces a centner as 100 kg without implying a person weighs 100 kg', () => {
    const { container } = render(<CentnerIntroVisual />);
    expect(container.querySelectorAll('.centner-comparison img')).toHaveLength(2);
    expect(screen.getByText('1 ц = 100 кг')).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: /центнер — груз в сто раз тяжелее/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/спортсмен|атлет/i)).not.toBeInTheDocument();
  });
  it('shows that a tonne is ten centners without drawing a wall of crates', () => {
    const { container } = render(<CentnerIntroVisual />);
    fireEvent.click(screen.getByRole('button', { name: 'Тонна' }));
    expect(container.querySelectorAll('.centner-comparison img')).toHaveLength(2);
    expect(screen.getByText('1 т = 10 ц = 1 000 кг')).toBeInTheDocument();
  });
});
