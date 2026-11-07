import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { YEAR_MATCH_SCENES, yearMatchFeedback, yearMatchTotal } from '../src/engine/year-match';
import { YearMonthsPilot } from '../src/ui/YearMonthsPilot';
import { STORAGE_KEY } from '../src/state/storage';

describe('month grouping trainer', () => {
  it('has correct, distinct choices without the answers of the approved exercises', () => {
    for (const scene of YEAR_MATCH_SCENES) {
      const total = yearMatchTotal(scene);
      expect(total).toBe(scene.years * 12 + scene.extra);
      expect(scene.choices.filter((choice) => choice === total)).toHaveLength(1);
      expect(new Set(scene.choices).size).toBe(scene.choices.length);
      expect([...scene.choices, total]).not.toContain(27);
      expect([...scene.choices, total]).not.toContain(48);
      for (const choice of scene.choices) {
        expect(yearMatchFeedback(scene, choice)).not.toMatch(/\b(?:27|48)\b/);
      }
    }
  });

  it('offers both different games on each slide and returns to the same model state', async () => {
    const user = userEvent.setup();
    const start = vi.fn();
    render(<YearMonthsPilot onPractice={start} />);
    for (let slide = 0; slide < 3; slide++) {
      expect(screen.getByRole('button', { name: 'Играть — игра «Собери год»' })).toBeVisible();
      await user.click(screen.getByRole('button', { name: 'Считай — игра «Считаем месяцы»' }));
      expect(screen.getByRole('heading', { name: 'Считаем месяцы' })).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'К объяснению' }));
      expect(screen.getByLabelText(`Шаг ${slide + 1} из 3`)).toBeInTheDocument();
      if (slide < 2) await user.click(screen.getByRole('button', { name: 'Дальше' }));
    }
    expect(start).not.toHaveBeenCalled();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('gives causal feedback, keeps a choice on hint, supports keyboard and never saves progress', async () => {
    const user = userEvent.setup();
    render(<YearMonthsPilot onPractice={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Считай — игра «Считаем месяцы»' }));
    const choices = () => within(screen.getByRole('group', { name: 'Выбери число месяцев' }));
    choices().getByRole('button', { name: '11' }).focus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('status')).toHaveTextContent('В каждом круге 12 месяцев');
    await user.click(screen.getByRole('button', { name: 'Подсказка' }));
    expect(choices().getByRole('button', { name: '11' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(choices().getByRole('button', { name: '12' }));
    expect(screen.getByRole('status')).toHaveTextContent('12 = 12 месяцев');
    await user.click(screen.getByRole('button', { name: 'Дальше' }));
    expect(screen.getByText('Ещё 1 месяц')).toBeInTheDocument();
    await user.click(choices().getByRole('button', { name: '25' }));
    expect(screen.getByRole('status')).toHaveTextContent('12 + 12 + 1 = 25 месяцев');
    await user.click(screen.getByRole('button', { name: 'Дальше' }));
    await user.click(choices().getByRole('button', { name: '36' }));
    expect(screen.getByRole('status')).toHaveTextContent('12 + 12 + 12 = 36 месяцев');
    await user.click(screen.getByRole('button', { name: 'Заново' }));
    expect(choices().getByRole('button', { name: '12' })).toHaveAttribute('aria-pressed', 'false');
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
