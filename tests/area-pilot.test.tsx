import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AREA_SIDES, equalArea } from '../src/engine/equal-area';
import { AreaPilot } from '../src/ui/AreaPilot';
import { STORAGE_KEY } from '../src/state/storage';

describe('area of equal parts', () => {
  it('computes all scenarios without disclosing the approved answer', () => {
    for (const side of AREA_SIDES)
      for (const parts of [2, 4] as const)
        for (let count = 0; count <= parts; count++) {
          const model = equalArea(side, parts, count);
          expect(model.whole).toBe(side * side);
          expect(model.part * parts).toBe(model.whole);
          expect(model.selectedArea).toBe(model.part * count);
          expect([side, model.whole, model.part, model.selectedArea]).not.toContain(16);
          if (parts === 4) expect([model.part - 1, model.part, model.part + 1]).not.toContain(16);
        }
    expect(() => equalArea(6, 4, 5)).toThrow();
  });
  it('changes the model at every step, returns to state and does not save game progress', async () => {
    const user = userEvent.setup();
    const practice = vi.fn();
    render(<AreaPilot onPractice={practice} />);
    for (let step = 1; step <= 3; step++) {
      const control = within(screen.getByRole('group', { name: 'Инструменты модели' })).getByRole(
        'button',
      );
      const before = screen
        .getByRole('img', { name: /Квадрат со стороной/ })
        .getAttribute('aria-label');
      await user.click(control);
      const after = screen
        .getByRole('img', { name: /Квадрат со стороной/ })
        .getAttribute('aria-label');
      expect(after).not.toEqual(before);
      for (const name of ['Найди часть', 'Собери половину']) {
        await user.click(screen.getByRole('button', { name: new RegExp(`игра «${name}»`) }));
        await user.click(screen.getByRole('button', { name: 'К объяснению' }));
        expect(screen.getByLabelText(`Шаг ${step} из 3`)).toBeInTheDocument();
        expect(screen.getByRole('img', { name: /Квадрат со стороной/ })).toHaveAttribute(
          'aria-label',
          after,
        );
      }
      if (step < 3) await user.click(screen.getByRole('button', { name: 'Дальше' }));
    }
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(practice).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Проверить себя' }));
    expect(practice).toHaveBeenCalledOnce();
  });
  it('explains an incorrect choice and supports selecting and removing any parts', async () => {
    const user = userEvent.setup();
    render(<AreaPilot onPractice={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: /игра «Найди часть»/ }));
    await user.click(screen.getByRole('button', { name: '8 см²' }));
    expect(screen.getByRole('status')).toHaveTextContent('Раздели');
    await user.click(screen.getByRole('button', { name: '9 см²' }));
    expect(screen.getByRole('status')).toHaveTextContent('36 : 4 = 9');
    await user.click(screen.getByRole('button', { name: 'К объяснению' }));
    await user.click(screen.getByRole('button', { name: /игра «Собери половину»/ }));
    const top = screen.getByRole('button', { name: 'Верхняя' });
    const left = screen.getByRole('button', { name: 'Левая' });
    await user.click(top);
    await user.click(top);
    expect(top).toHaveAttribute('aria-pressed', 'false');
    await user.click(top);
    await user.click(left);
    await user.click(screen.getByRole('button', { name: 'Готово' }));
    expect(screen.getByRole('status')).toHaveTextContent('9 + 9 = 18');
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
