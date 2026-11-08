import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ClockPilot } from '../src/ui/ClockPilot';
import { allTimes, digitalTime, sameTime, spokenTime, type ClockTime } from '../src/engine/clock';

const STORAGE_KEY = 'chislo:data:v1';

/** The exact wordings of the checked exercises: no screen of the lesson may print them. */
const CHECKED_PHRASES = [
  'половина шестого',
  'без четверти восемь',
  'без пяти шесть',
  'без двадцати восемь',
  'двадцать минут девятое',
  'двадцать минут девятого',
  'четверть седьмого',
  'без четверти семь',
];

function clockOf(container: HTMLElement): ClockTime {
  const label = container.querySelector('.clock-dial svg')?.getAttribute('aria-label') ?? '';
  const match = label.match(/(\d{1,2}):(\d{2})/);
  if (!match) throw new Error('На экране нет часов');
  return { hour: Number(match[1]), minute: Number(match[2]) };
}

function readoutOf(container: HTMLElement) {
  return container.querySelector('.clock-readout')?.textContent ?? '';
}

function timeOfPhrase(phrase: string): ClockTime {
  const found = allTimes().find((time) => spokenTime(time) === phrase);
  if (!found) throw new Error(`Неизвестная фраза: ${phrase}`);
  return found;
}

describe('clock explanation', () => {
  it('keeps three compact steps, one visible header line and never prints a checked answer', () => {
    const { container } = render(<ClockPilot onPractice={vi.fn()} />);
    for (const step of [1, 2, 3]) {
      expect(container.querySelector('.pilot-steps')).toHaveAttribute(
        'aria-label',
        `Шаг ${step} из 3`,
      );
      expect(container.querySelector('.clock-pilot h3')).toHaveClass('sr-only');
      expect(container.querySelector('.pilot-instruction')).toHaveClass('sr-only');
      expect(container.querySelector('.pilot-topline')!.textContent).toBe('');
      const text = (container.textContent ?? '').toLowerCase();
      for (const phrase of CHECKED_PHRASES) expect(text).not.toContain(phrase.toLowerCase());
      if (step < 3) fireEvent.click(screen.getByRole('button', { name: 'Дальше' }));
    }
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('changes the hour and the minute independently and shows the colour key', () => {
    const { container } = render(<ClockPilot onPractice={vi.fn()} />);
    expect(clockOf(container)).toEqual({ hour: 3, minute: 20 });
    expect(container.querySelector('.clock-progress')?.textContent).toContain('прошло 20 мин');
    expect(container.querySelector('.clock-progress')?.textContent).toContain('осталось 40 мин');

    fireEvent.click(screen.getByRole('button', { name: 'Другой час' }));
    expect(clockOf(container)).toEqual({ hour: 4, minute: 20 });
    expect(readoutOf(container)).toContain('двадцать минут пятого');

    fireEvent.click(screen.getByRole('button', { name: 'Другая минута' }));
    expect(clockOf(container)).toEqual({ hour: 4, minute: 25 });
    expect(container.querySelector('.clock-arc-passed')).toBeInTheDocument();
    expect(container.querySelector('.clock-arc-left')).toBeInTheDocument();
  });

  it('shows a quarter, a half and a quarter before the hour', () => {
    const { container } = render(<ClockPilot onPractice={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Дальше' }));
    expect(readoutOf(container)).toContain('половина четвёртого');
    expect(screen.getByRole('button', { name: /Половина/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    fireEvent.click(screen.getByRole('button', { name: /Четверть/ }));
    expect(readoutOf(container)).toContain('четверть четвёртого');
    fireEvent.click(screen.getByRole('button', { name: /Без четверти/ }));
    expect(readoutOf(container)).toContain('без четверти четыре');

    fireEvent.click(screen.getByRole('button', { name: 'Другой час' }));
    expect(readoutOf(container)).toContain('без четверти пять');
    expect(clockOf(container).hour).toBe(4);
  });

  it('walks the minutes towards the whole hour and counts what is left', () => {
    const { container } = render(<ClockPilot onPractice={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Дальше' }));
    fireEvent.click(screen.getByRole('button', { name: 'Дальше' }));
    expect(clockOf(container)).toEqual({ hour: 3, minute: 5 });
    expect(readoutOf(container)).toContain('пять минут четвёртого');

    for (let i = 0; i < 6; i += 1)
      fireEvent.click(screen.getByRole('button', { name: '+5 мин: добавить пять минут' }));
    expect(clockOf(container)).toEqual({ hour: 3, minute: 35 });
    expect(readoutOf(container)).toContain('без двадцати пяти четыре');
    expect(screen.getByRole('status')).toHaveTextContent('не хватает 25 мин');

    fireEvent.click(screen.getByRole('button', { name: '−5 мин: убрать пять минут' }));
    expect(clockOf(container)).toEqual({ hour: 3, minute: 30 });
  });

  it('opens all three games from any step and returns to the same step', () => {
    const { container } = render(<ClockPilot onPractice={vi.fn()} />);
    for (const name of ['Игра «Назови время»', 'Игра «Поставь стрелки»', 'Игра «Собери фразу»']) {
      fireEvent.click(screen.getByRole('button', { name }));
      expect(container.querySelector('.clock-game')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Проверить себя' })).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'К объяснению' }));
      expect(container.querySelector('.clock-pilot')).toBeInTheDocument();
      expect(container.querySelector('.pilot-steps')).toHaveAttribute('aria-label', 'Шаг 1 из 3');
    }
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('starts the checked session only on an explicit action', () => {
    const onPractice = vi.fn();
    render(<ClockPilot onPractice={onPractice} />);
    fireEvent.click(screen.getByRole('button', { name: 'Дальше' }));
    fireEvent.click(screen.getByRole('button', { name: 'Назад' }));
    expect(onPractice).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Дальше' }));
    fireEvent.click(screen.getByRole('button', { name: 'Дальше' }));
    fireEvent.click(screen.getByRole('button', { name: 'Проверить себя' }));
    expect(onPractice).toHaveBeenCalledTimes(1);
  });
});

describe('clock games', () => {
  it('names the time by its wording, with four choices and no stored progress', () => {
    const { container } = render(<ClockPilot onPractice={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Игра «Назови время»' }));
    const time = clockOf(container);
    expect(container.querySelectorAll('.clock-choice')).toHaveLength(4);
    fireEvent.click(screen.getByRole('button', { name: spokenTime(time) }));
    expect(screen.getByRole('status')).toHaveTextContent('Верно!');
    expect(screen.getByRole('button', { name: 'Ещё время' })).toBeInTheDocument();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('refuses a wrong hour with the cause and keeps the clock in place', () => {
    const { container } = render(<ClockPilot onPractice={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Игра «Назови время»' }));
    const time = clockOf(container);
    const buttons = Array.from(container.querySelectorAll('.clock-choice'));
    const wrong = buttons.find((button) => button.textContent !== spokenTime(time))!;
    fireEvent.click(wrong);
    expect(clockOf(container)).toEqual(time);
    expect(screen.getByRole('status').textContent).not.toContain('Верно');
  });

  it('sets the minute hand on the ring and the hour with buttons', () => {
    const { container } = render(<ClockPilot onPractice={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Игра «Поставь стрелки»' }));
    const phrase = container.querySelector('.clock-target strong')!.textContent!;
    const target = timeOfPhrase(phrase);
    expect(clockOf(container)).not.toEqual(target);

    // The hour starts two hours ahead of the target, so two taps come back to it.
    for (let i = 0; i < 2; i += 1)
      fireEvent.click(screen.getByRole('button', { name: '−1 час: предыдущий час' }));
    expect(clockOf(container).hour).toBe(target.hour);

    fireEvent.click(container.querySelector(`[data-clock-minute="${target.minute}"]`)!);
    expect(clockOf(container)).toEqual(target);
    fireEvent.click(screen.getByRole('button', { name: 'Проверить' }));
    expect(screen.getByRole('status')).toHaveTextContent('Верно!');
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('builds the phrase word by word and refuses a word out of order', () => {
    const { container } = render(<ClockPilot onPractice={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Игра «Собери фразу»' }));
    const time = clockOf(container);
    const words = spokenTime(time).split(' ');
    const outsider = ['половина', 'без', 'десяти', 'минут'].find((word) => !words.includes(word))!;
    const decoy = screen.queryByRole('button', { name: `Слово «${outsider}»` });
    if (decoy) {
      fireEvent.click(decoy);
      expect(screen.getByRole('status').textContent).not.toContain('Верно');
      expect(container.querySelectorAll('.clock-phrase-word')).toHaveLength(0);
    }
    for (const word of words) {
      fireEvent.click(screen.getByRole('button', { name: `Слово «${word}»` }));
    }
    expect(screen.getByRole('status')).toHaveTextContent('Верно!');
    expect(container.querySelector('.clock-phrase.is-done')).toBeInTheDocument();
    expect(container.querySelectorAll('.clock-phrase-word')).toHaveLength(words.length);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('never shows a checked moment inside a game round', () => {
    const { container } = render(<ClockPilot onPractice={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Игра «Назови время»' }));
    const time = clockOf(container);
    expect(['5:30', '7:45', '6:15', '6:45', '5:55', '7:40', '8:20']).not.toContain(
      digitalTime(time),
    );
    const text = (container.textContent ?? '').toLowerCase();
    for (const phrase of CHECKED_PHRASES) expect(text).not.toContain(phrase.toLowerCase());
    const unique = new Set(
      Array.from(container.querySelectorAll('.clock-choice')).map((node) => node.textContent),
    );
    expect(unique.size).toBe(4);
    expect(sameTime(time, time)).toBe(true);
  });
});
