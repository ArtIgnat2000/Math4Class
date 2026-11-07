import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DIVIDEND_SCENES, dividendModel } from '../src/engine/dividend-model';
import { DividendPilot } from '../src/ui/DividendPilot';
import { STORAGE_KEY } from '../src/state/storage';

describe('division with remainder explanation', () => {
  it('calculates each scene and rejects impossible remainders', () => {
    for (const scene of DIVIDEND_SCENES) {
      const model = dividendModel(scene);
      expect(model.dividend).toBe(scene.divisor * scene.quotient + scene.remainder);
      expect(scene.remainder).toBeLessThan(scene.divisor);
      for (let r = 0; r < scene.divisor; r++) {
        const value = dividendModel({ ...scene, remainder: r }).dividend;
        expect([59, 70, 80, 747]).not.toContain(value);
        expect([59, 70, 80, 747]).not.toContain(value - 1);
        expect([59, 70, 80, 747]).not.toContain(value + 1);
      }
    }
    expect(() => dividendModel({ divisor: 4, quotient: 2, remainder: 4 })).toThrow();
    expect(() => dividendModel({ divisor: 4, quotient: 2, remainder: -1 })).toThrow();
  });
  it('changes scenes on all steps and returns to the same scene from both games', async () => {
    const user = userEvent.setup();
    const practice = vi.fn();
    render(<DividendPilot onPractice={practice} />);
    for (let step = 1; step <= 3; step++) {
      await user.click(screen.getByRole('button', { name: 'Другой пример' }));
      const label = screen.getByRole('img', { name: /группы по/ }).getAttribute('aria-label');
      for (const game of ['Найди делимое', 'Собери остаток']) {
        await user.click(screen.getByRole('button', { name: new RegExp(game) }));
        await user.click(screen.getByRole('button', { name: 'К объяснению' }));
        expect(screen.getByLabelText(`Шаг ${step} из 3`)).toBeInTheDocument();
        expect(screen.getByRole('img', { name: /группы по/ })).toHaveAttribute('aria-label', label);
      }
      if (step < 3) await user.click(screen.getByRole('button', { name: 'Дальше' }));
    }
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(practice).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Проверить себя' }));
    expect(practice).toHaveBeenCalledOnce();
  });
  it('gives actionable feedback and enforces remainder smaller than divisor', async () => {
    const user = userEvent.setup();
    render(<DividendPilot onPractice={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: /игра «Найди делимое»/ }));
    const choices = within(screen.getByRole('group', { name: 'Выбери делимое' }));
    expect(screen.getByRole('img')).not.toHaveAccessibleName(/всего 13/);
    await user.click(choices.getByRole('button', { name: '12' }));
    expect(screen.getByRole('status')).toHaveTextContent('Сложи');
    await user.click(choices.getByRole('button', { name: '13' }));
    expect(screen.getByRole('status')).toHaveTextContent('4 × 3 + 1 = 13');
    await user.click(screen.getByRole('button', { name: 'К объяснению' }));
    await user.click(screen.getByRole('button', { name: /игра «Собери остаток»/ }));
    await user.click(screen.getByRole('button', { name: '− 1' }));
    expect(screen.getByRole('status')).toHaveTextContent('В остатке пока нет предметов');
    for (let i = 0; i < 4; i++) await user.click(screen.getByRole('button', { name: '+ 1' }));
    expect(screen.getByRole('status')).toHaveTextContent('Остаток должен быть меньше делителя');
    await user.click(screen.getByRole('button', { name: 'Заново' }));
    await user.click(screen.getByRole('button', { name: '+ 1' }));
    await user.click(screen.getByRole('button', { name: 'Готово' }));
    expect(screen.getByRole('status')).toHaveTextContent('12 + 1 = 13');
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
