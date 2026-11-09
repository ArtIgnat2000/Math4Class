import { useRef, useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  displayIndexFromRaw,
  groupNumericInput,
  normalizeNumericInput,
  numericInputDisplay,
  rawIndexFromDisplay,
} from '../src/engine/number-input';
import { NumericInput } from '../src/ui/NumericInput';
import { NumericKeypad } from '../src/ui/NumericKeypad';
import { Lesson } from '../src/ui/Lesson';
import { createSession } from '../src/engine/lesson';
import { BUILTIN_PACKS } from '../src/content';

describe('разряды в числовом поле', () => {
  it('очищает ответ от пробелов и посторонних символов', () => {
    expect(normalizeNumericInput('1 234 567')).toBe('1234567');
    expect(normalizeNumericInput('1\u00a0234\u202f567')).toBe('1234567');
    expect(normalizeNumericInput(' 12,50 ')).toBe('12,50');
    expect(normalizeNumericInput('12.50')).toBe('12,50');
    expect(normalizeNumericInput('−7')).toBe('-7');
    expect(normalizeNumericInput('-')).toBe('-');
    expect(normalizeNumericInput('12,')).toBe('12,');
    expect(normalizeNumericInput('1a2b3')).toBe('123');
    expect(normalizeNumericInput('--5')).toBe('-5');
    expect(normalizeNumericInput('')).toBe('');
  });

  it('делит целую часть на триады и не трогает дробную', () => {
    expect(groupNumericInput('')).toBe('');
    expect(groupNumericInput('7')).toBe('7');
    expect(groupNumericInput('100')).toBe('100');
    expect(groupNumericInput('1000')).toBe('1 000');
    expect(groupNumericInput('860000')).toBe('860 000');
    expect(groupNumericInput('800000')).toBe('800 000');
    expect(groupNumericInput('1234567')).toBe('1 234 567');
    expect(groupNumericInput('1000000')).toBe('1 000 000');
    expect(groupNumericInput('1234567,891')).toBe('1 234 567,891');
    expect(groupNumericInput('-1234')).toBe('-1 234');
    expect(groupNumericInput('12,')).toBe('12,');
  });

  it('переводит курсор между ответом и показом с пробелами', () => {
    const raw = '1234567';
    // После второй цифры курсор стоит после «2» в «1 234 567».
    expect(displayIndexFromRaw(raw, 2)).toBe(3);
    expect(displayIndexFromRaw(raw, 0)).toBe(0);
    expect(displayIndexFromRaw(raw, 7)).toBe(9);
    expect(displayIndexFromRaw(raw, 99)).toBe(9);
    expect(rawIndexFromDisplay('1 234 567', 3)).toBe(2);
    expect(rawIndexFromDisplay('1 234 567', 2)).toBe(1);
    expect(rawIndexFromDisplay('1 234 567', 9)).toBe(7);
    // Ответ с минусом и запятой.
    expect(displayIndexFromRaw('-1234,5', 5)).toBe(6);
    expect(rawIndexFromDisplay('-1 234,5', 6)).toBe(5);
    for (let index = 0; index <= raw.length; index++) {
      const shown = displayIndexFromRaw(raw, index);
      expect(rawIndexFromDisplay(groupNumericInput(raw), shown)).toBe(index);
    }
    expect(numericInputDisplay('1000').positions).toEqual([0, 1, 3, 4, 5]);
  });
});

function Harness({ initial = '' }: { initial?: string }) {
  const [value, setValue] = useState(initial);
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <NumericInput inputRef={inputRef} value={value} onChange={setValue} />
      <output data-testid="raw">{value}</output>
      <NumericKeypad value={value} onChange={setValue} inputRef={inputRef} />
    </>
  );
}

describe('поле ответа с разрядами', () => {
  it('показывает пробелы, а хранит ответ без них', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByRole('textbox');
    await user.type(input, '860000');
    expect(input).toHaveValue('860 000');
    expect(screen.getByTestId('raw')).toHaveTextContent(/^860000$/);
  });

  it('вводит разряды и с экранной клавиатуры', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    for (const digit of ['8', '0', '0', '0', '0', '0']) {
      await user.click(screen.getByRole('button', { name: `Ввести ${digit}` }));
    }
    expect(screen.getByRole('textbox')).toHaveValue('800 000');
    await user.click(screen.getByRole('button', { name: 'Удалить цифру' }));
    expect(screen.getByRole('textbox')).toHaveValue('80 000');
    expect(screen.getByTestId('raw')).toHaveTextContent(/^80000$/);
  });

  it('удаляет цифру, даже если курсор стоит после пробела', async () => {
    const user = userEvent.setup();
    render(<Harness initial="1234" />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input).toHaveValue('1 234');
    // Курсор сразу после пробела: Backspace должен убрать «1», а не только пробел.
    input.focus();
    input.setSelectionRange(2, 2);
    await user.keyboard('{Backspace}');
    expect(input).toHaveValue('234');
    expect(screen.getByTestId('raw')).toHaveTextContent(/^234$/);
  });

  it('не даёт ввести вторую запятую', async () => {
    const user = userEvent.setup();
    render(<Harness initial="1234567" />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    await user.type(input, ',');
    expect(input.value).toBe('1 234 567,');
    await user.type(input, ',');
    expect(input.value).toBe('1 234 567,');
  });

  it('сохраняет курсор при правке в середине числа', async () => {
    const user = userEvent.setup();
    render(<Harness initial="1234567" />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    input.focus();
    input.setSelectionRange(3, 3);
    await user.keyboard('9');
    expect(input.value).toBe('12 934 567');
    // Курсор остаётся сразу после вставленной цифры, а не прыгает в конец.
    expect(input.selectionStart).toBe(4);
  });
});

describe('ответ урока', () => {
  it('принимает большое число с разрядами и проверяет его без пробелов', async () => {
    const user = userEvent.setup();
    const topic = BUILTIN_PACKS[4].topics.find((item) => item.id === 'multiply-divide-powers-ten')!;
    const task = topic.tasks.find((item) => item.id === 'power-2')!;
    const submit = vi.fn();
    render(
      <Lesson
        session={createSession({ ...topic, tasks: [task] }, 4)}
        onChange={vi.fn()}
        onSubmit={submit}
        onNext={vi.fn()}
        onExit={vi.fn()}
      />,
    );
    const answer = screen.getByLabelText('Твой ответ');
    await user.type(answer, '800000');
    expect(answer).toHaveValue('800 000');
    await user.click(screen.getByRole('button', { name: 'Проверить' }));
    expect(submit).toHaveBeenCalledWith('800000');
  });
});
