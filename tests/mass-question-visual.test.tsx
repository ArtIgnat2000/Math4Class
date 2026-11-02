import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MassQuestionVisual } from '../src/ui/MassQuestionVisual';

describe('one faithful picture per mass question', () => {
  it.each([
    ['kg-3', 3, 0, 'Три отдельные гири'],
    ['mixed-2-350', 2, 1, 'Две гири по 1 кг'],
    ['g-7000', 0, 1, 'число килограммов не указано'],
    ['mixed-4050', 0, 1, 'оставшихся граммов не указано'],
    ['compare-5', 5, 1, 'Между ними вопросительный знак'],
    ['to-kilo', 2, 1, 'неизвестная добавка'],
    ['order-mass', 0, 0, 'Четыре неупорядоченные карточки'],
    ['weighing', 0, 0, 'количество яблок неизвестно'],
  ])('%s shows only known quantities', (id, weights, parcels, description) => {
    const { container, unmount } = render(<MassQuestionVisual taskId={id} />);
    expect(screen.getByRole('img', { name: new RegExp(description) })).toBeInTheDocument();
    expect(container.querySelectorAll('.mass-object-weight')).toHaveLength(weights);
    expect(container.querySelectorAll('.mass-object-parcel')).toHaveLength(parcels);
    unmount();
  });
  it('does not show sorted cards before an ordering answer', () => {
    const { container } = render(<MassQuestionVisual taskId="order-mass" />);
    expect(
      Array.from(
        container.querySelectorAll('.mass-question-cards span'),
        (card) => card.textContent,
      ),
    ).toEqual(['1 кг 50 г', '900 г', '1 500 г', '1 кг']);
  });
  it('does not invent a scene for other topics', () => {
    const { container } = render(<MassQuestionVisual taskId="unrelated" />);
    expect(container).toBeEmptyDOMElement();
  });
});
