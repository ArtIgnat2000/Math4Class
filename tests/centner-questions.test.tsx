import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CentnerQuestionVisual } from '../src/ui/CentnerQuestionVisual';

const cases = [
  ['centners-6', 6],
  ['tonnes-3', 3],
  ['tonnes-to-centners', 4],
  ['mixed-tonnes', 6],
  ['kg-2300', 1],
  ['equal', 2],
  ['kg-to-centners', 1],
  ['order', 12],
] as const;

describe('centner task scenes', () => {
  it.each(cases)('%s depicts only the given loads', (id, count) => {
    const { container } = render(<CentnerQuestionVisual taskId={id} />);
    expect(container.querySelectorAll('.centner-load img')).toHaveLength(count);
    expect(screen.getByRole('img')).toHaveAttribute('aria-label');
  });
  it('does not give away the conversion of four tonnes to centners', () => {
    const { container } = render(<CentnerQuestionVisual taskId="tonnes-to-centners" />);
    expect(container.querySelectorAll('.centner-load-tonne')).toHaveLength(4);
    expect(screen.queryByText('40 ц')).not.toBeInTheDocument();
  });
  it('does not sort the masses in the ordering picture', () => {
    render(<CentnerQuestionVisual taskId="order" />);
    expect(
      screen.getAllByText(/^(80 кг|1 ц|9 ц|1 т)$/).map((element) => element.textContent),
    ).toEqual(['80 кг', '1 ц', '9 ц', '1 т']);
  });
});
