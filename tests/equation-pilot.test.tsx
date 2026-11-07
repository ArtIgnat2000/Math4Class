import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { EQUATION_SCENES, equationChoices, equationModel } from '../src/engine/equation-model';
import { EquationPilot } from '../src/ui/EquationPilot';
import { STORAGE_KEY } from '../src/state/storage';

describe('equation explanation and games', () => {
  it('computes all inverse operations and keeps approved answers out of examples and choices', () => {
    for (const [first, second] of EQUATION_SCENES)
      for (const problem of [first, second]) {
        const model = equationModel(problem);
        expect(model.parts[0] + model.parts[1]).toBe(model.whole);
        if (problem.kind === 'summand') expect(problem.known + model.unknown).toBe(problem.result);
        if (problem.kind === 'minuend') expect(model.unknown - problem.known).toBe(problem.result);
        if (problem.kind === 'subtrahend')
          expect(problem.result - model.unknown).toBe(problem.known);
        expect(equationChoices(problem)).toContain(model.unknown);
        for (const value of [
          model.whole,
          ...model.parts,
          model.unknown,
          ...equationChoices(problem),
        ])
          expect([170, 270, 900]).not.toContain(value);
      }
    expect(() => equationModel({ kind: 'summand', known: 9, result: 8 })).toThrow();
  });

  it('changes each model, opens both games on every step and preserves the chosen example', async () => {
    const user = userEvent.setup();
    const practice = vi.fn();
    const { container } = render(<EquationPilot onPractice={practice} />);
    for (let step = 0; step < 3; step++) {
      await user.click(screen.getByRole('button', { name: 'Другой пример' }));
      const expression = equationModel(EQUATION_SCENES[step][1]).equation;
      expect(container.querySelector('.equation-line')).toHaveTextContent(expression);
      for (const name of ['Найди число', 'Собери решение']) {
        await user.click(screen.getByRole('button', { name: new RegExp(name) }));
        expect(screen.getByRole('heading', { name })).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'К объяснению' }));
        expect(screen.getByLabelText(`Шаг ${step + 1} из 3`)).toBeInTheDocument();
        expect(container.querySelector('.equation-line')).toHaveTextContent(expression);
      }
      if (step < 2) await user.click(screen.getByRole('button', { name: 'Дальше' }));
    }
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(practice).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Проверить себя' }));
    expect(practice).toHaveBeenCalledOnce();
  });

  it('explains wrong choices and assembles a solution without losing cards', async () => {
    const user = userEvent.setup();
    render(<EquationPilot onPractice={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: /игра «Найди число»/ }));
    const choices = within(screen.getByRole('group', { name: 'Выбери значение x' }));
    await user.click(choices.getByRole('button', { name: '7' }));
    expect(screen.getByRole('status')).toHaveTextContent('вычти известную часть');
    await user.click(screen.getByRole('button', { name: 'Подсказка' }));
    expect(choices.getByRole('button', { name: '7' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(choices.getByRole('button', { name: '8' }));
    expect(screen.getByRole('status')).toHaveTextContent('x = 14 − 6 = 8');
    await user.click(screen.getByRole('button', { name: 'К объяснению' }));
    await user.click(screen.getByRole('button', { name: /игра «Собери решение»/ }));
    const tray = within(screen.getByRole('group', { name: 'Карточки решения' }));
    await user.click(tray.getByRole('button', { name: 'x = 8' }));
    expect(screen.getByRole('status')).toHaveTextContent('Сначала найди исходное уравнение');
    expect(tray.getByRole('button', { name: 'x = 8' })).toBeEnabled();
    await user.click(tray.getByRole('button', { name: '6 + x = 14' }));
    await user.click(tray.getByRole('button', { name: 'x = 14 − 6' }));
    await user.click(tray.getByRole('button', { name: 'x = 8' }));
    expect(screen.getByRole('button', { name: 'Дальше' })).toBeVisible();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
