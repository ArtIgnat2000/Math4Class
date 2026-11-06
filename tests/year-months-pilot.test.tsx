import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { YearMonthsPilot } from '../src/ui/YearMonthsPilot';
import { STORAGE_KEY } from '../src/state/storage';

describe('interactive year → months explanation', () => {
  it('builds a twelve-part year, inspects months by keyboard and never starts a quiz', async () => {
    const user = userEvent.setup();
    const onPractice = vi.fn();
    const { container } = render(<YearMonthsPilot onPractice={onPractice} />);
    const months = within(screen.getByRole('group', { name: 'Круг года: 12 месяцев' }));
    expect(months.getAllByRole('button')).toHaveLength(12);
    expect(screen.queryByRole('button', { name: 'Проверить себя' })).not.toBeInTheDocument();

    for (let count = 1; count <= 12; count += 1) {
      await user.click(screen.getByRole('button', { name: '+ месяц' }));
      expect(container.querySelectorAll('.year-clock .year-sector.is-filled')).toHaveLength(count);
    }
    expect(screen.getByRole('status')).toHaveTextContent('1 год = 12 месяцев.');
    await user.click(screen.getByRole('button', { name: 'Пройти ещё раз' }));
    expect(container.querySelectorAll('.year-clock .year-sector.is-filled')).toHaveLength(0);

    const april = screen.getByRole('button', { name: 'Апрель — 4-й месяц года' });
    april.focus();
    await user.keyboard('{Enter}');
    expect(april).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('Апрель — 4-й месяц');
    expect(screen.getByRole('status')).toHaveTextContent('Весна');
    expect(container.querySelectorAll('.year-clock .year-sector.is-filled')).toHaveLength(0);
    expect(onPractice).not.toHaveBeenCalled();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('opens the author’s game from the first slide and comes back without progress', async () => {
    const user = userEvent.setup();
    const onPractice = vi.fn();
    const { container } = render(<YearMonthsPilot onPractice={onPractice} />);
    await user.click(screen.getByRole('button', { name: 'Игра «Собери год»' }));
    expect(screen.getByRole('heading', { name: 'Собери год' })).toBeVisible();
    expect(
      within(screen.getByRole('group', { name: 'Круг года: места для месяцев' })).getAllByRole(
        'button',
      ),
    ).toHaveLength(12);
    expect(container.querySelectorAll('.year-game-chip')).toHaveLength(12);
    expect(screen.queryByRole('button', { name: 'Проверить себя' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'К объяснению' }));
    expect(screen.getByRole('group', { name: 'Круг года: 12 месяцев' })).toBeVisible();
    expect(onPractice).not.toHaveBeenCalled();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('opens a short season reference without hiding navigation or changing progress', async () => {
    const user = userEvent.setup();
    render(<YearMonthsPilot onPractice={vi.fn()} />);
    const toggle = screen.getByRole('button', { name: 'Времена года' });
    await user.click(toggle);
    const reference = screen.getByLabelText('Времена года');
    expect(reference).toBeVisible();
    expect(within(reference).getByText('Июнь, июль, август')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Дальше' })).toBeVisible();
    await user.click(toggle);
    expect(reference).not.toBeVisible();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('finishes the addition, yet still cannot reach the approved answers', async () => {
    const user = userEvent.setup();
    const { container } = render(<YearMonthsPilot onPractice={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Дальше' }));
    expect(container.querySelectorAll('.year-group-card')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Убрать год' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: '+ год' }));
    await user.click(screen.getByRole('button', { name: '+ год' }));
    expect(container.querySelectorAll('.year-group-card')).toHaveLength(3);
    expect(container.querySelectorAll('.year-group-card .year-sector')).toHaveLength(36);
    expect(screen.getByRole('button', { name: 'В примере 3 года' })).toBeDisabled();
    expect(container.querySelector('.pilot-formula')).toHaveTextContent(
      '12 + 12 + 12= 3 × 12= 36 месяцев',
    );
    expect(screen.queryByText(/48 месяцев|27 месяцев/)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Убрать год' }));
    expect(container.querySelectorAll('.year-group-card')).toHaveLength(2);
  });

  it('adds loose months outside whole years and starts practice only on explicit choice', async () => {
    const user = userEvent.setup();
    const onPractice = vi.fn();
    const { container } = render(<YearMonthsPilot onPractice={onPractice} />);
    await user.click(screen.getByRole('button', { name: 'Дальше' }));
    await user.click(screen.getByRole('button', { name: 'Дальше' }));
    expect(container.querySelectorAll('.year-group-card')).toHaveLength(2);
    expect(container.querySelectorAll('.extra-month-token')).toHaveLength(0);
    expect(screen.getByRole('button', { name: 'Убрать отдельный месяц' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: '+ месяц' }));
    await user.click(screen.getByRole('button', { name: '+ месяц' }));
    expect(container.querySelectorAll('.extra-month-token')).toHaveLength(2);
    expect(container.querySelector('.pilot-formula')).toHaveTextContent(
      '12 + 12 + 1 + 1= 2 × 12 + 2= 26 месяцев',
    );
    expect(screen.queryByText(/48 месяцев|27 месяцев/)).not.toBeInTheDocument();
    expect(onPractice).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Назад' }));
    await user.click(screen.getByRole('button', { name: 'Дальше' }));
    expect(container.querySelectorAll('.extra-month-token')).toHaveLength(2);
    await user.click(screen.getByRole('button', { name: 'Проверить себя' }));
    expect(onPractice).toHaveBeenCalledOnce();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
