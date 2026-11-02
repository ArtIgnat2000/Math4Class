import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MathVisual, parseVisualExpression } from '../src/ui/MathVisual';

describe('concrete arithmetic model', () => {
  it('shows exactly the number of units represented', () => {
    const { container, rerender } = render(<MathVisual expression="5 + 3" />);
    expect(container.querySelectorAll('.math-cube')).toHaveLength(8);
    expect(
      screen.getByRole('img', { name: '5 оранжевых кубиков и 3 зелёных кубиков' }),
    ).toBeInTheDocument();
    rerender(<MathVisual expression="9 − 4" />);
    expect(container.querySelectorAll('.math-cube.removed')).toHaveLength(4);
    rerender(<MathVisual expression="3 × 4" />);
    expect(container.querySelectorAll('.math-visual-group')).toHaveLength(3);
    expect(container.querySelectorAll('.math-cube')).toHaveLength(12);
  });
  it('does not invent a misleading model for large or compound expressions', () => {
    expect(parseVisualExpression('100 + 20')).toBeNull();
    expect(parseVisualExpression('5 + 3 × 2')).toBeNull();
    expect(parseVisualExpression('4 − 9')).toBeNull();
  });
});
