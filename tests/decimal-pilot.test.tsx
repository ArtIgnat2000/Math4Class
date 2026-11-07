import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DECIMAL_SCENES, decimalModel, type DecimalKind } from '../src/engine/decimal-lessons';
import { DecimalPilot } from '../src/ui/DecimalPilot';
import { STORAGE_KEY } from '../src/state/storage';

const forbidden: Record<DecimalKind, number[]> = {
  powers: [706000, 800000, 1000000, 100000],
  place: [23025, 18350, 37480, 50, 80, 69005, 3506],
};
for (const kind of ['powers', 'place'] as const)
  describe(`${kind} decimal explanation`, () => {
    it('computes all scenes and keeps answers out of models and choices', () => {
      for (const pair of DECIMAL_SCENES[kind])
        for (const scene of pair) {
          const m = decimalModel(scene);
          const expected =
            scene.operation === '×'
              ? scene.left * scene.right
              : scene.operation === ':'
                ? scene.left / scene.right
                : scene.operation === '+'
                  ? scene.left + scene.right
                  : scene.left - scene.right;
          expect(m.result).toBe(expected);
          expect(Number(m.input.join(''))).toBe(scene.left);
          expect(Number(m.output.join(''))).toBe(m.result);
          for (const value of [scene.left, scene.right, m.result, m.result - 1, m.result + 1])
            expect(forbidden[kind]).not.toContain(value);
        }
      expect(() => decimalModel({ left: 13, operation: ':', right: 10 })).toThrow();
    });
    it('changes each model and restores it from both games without saving', async () => {
      const user = userEvent.setup();
      const practice = vi.fn();
      render(<DecimalPilot kind={kind} onPractice={practice} />);
      for (let step = 1; step <= 3; step++) {
        const model = () => screen.getByRole('img', { name: /До действия/ });
        const before = model().getAttribute('aria-label');
        await user.click(screen.getByRole('button', { name: 'Другой пример' }));
        const after = model().getAttribute('aria-label');
        expect(after).not.toEqual(before);
        for (const game of ['Найди результат', 'Собери число']) {
          await user.click(screen.getByRole('button', { name: new RegExp(`игра «${game}»`) }));
          await user.click(screen.getByRole('button', { name: 'К объяснению' }));
          expect(screen.getByLabelText(`Шаг ${step} из 3`)).toBeInTheDocument();
          expect(model()).toHaveAttribute('aria-label', after);
        }
        if (step < 3) await user.click(screen.getByRole('button', { name: 'Дальше' }));
      }
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
      expect(practice).not.toHaveBeenCalled();
      await user.click(screen.getByRole('button', { name: 'Проверить себя' }));
      expect(practice).toHaveBeenCalledOnce();
    });
    it('gives causal feedback and builds the digit sequence', async () => {
      const user = userEvent.setup();
      render(<DecimalPilot kind={kind} onPractice={vi.fn()} />);
      const model = decimalModel(DECIMAL_SCENES[kind][0][0]);
      await user.click(screen.getByRole('button', { name: /игра «Найди результат»/ }));
      const choices = within(screen.getByRole('group', { name: 'Выбери результат' }));
      await user.click(
        choices.getByRole('button', {
          name: new RegExp(String(model.result - 1).replace(/\B(?=(\d{3})+(?!\d))/g, '\\s?')),
        }),
      );
      expect(screen.getByRole('status')).toHaveTextContent(
        kind === 'powers' ? 'разрядов' : 'разряде',
      );
      await user.click(screen.getByRole('button', { name: 'К объяснению' }));
      await user.click(screen.getByRole('button', { name: /игра «Собери число»/ }));
      for (const digit of model.digits)
        await user.click(
          within(screen.getByRole('group', { name: 'Выбери цифру' })).getByRole('button', {
            name: new RegExp(`^${digit}$`),
          }),
        );
      expect(screen.getByRole('status')).toHaveTextContent('Получилось');
      expect(screen.getByRole('button', { name: 'Дальше' })).toBeVisible();
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });
  });
