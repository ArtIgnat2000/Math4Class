import { useRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { NumericKeypad } from '../src/ui/NumericKeypad';

function Harness({
  allowDecimal = false,
  allowNegative = false,
}: {
  allowDecimal?: boolean;
  allowNegative?: boolean;
}) {
  const [value, setValue] = useState('12');
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={inputRef}
        aria-label="Ответ"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <NumericKeypad
        value={value}
        onChange={setValue}
        inputRef={inputRef}
        allowDecimal={allowDecimal}
        allowNegative={allowNegative}
      />
    </>
  );
}

describe('numeric keypad', () => {
  it('inserts at the caret, deletes and toggles the sign without submitting the form', () => {
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) =>
      frames.push(callback),
    );
    const flush = () =>
      act(() => {
        while (frames.length) frames.shift()!(0);
      });
    render(<Harness allowDecimal allowNegative />);
    const input = screen.getByRole('textbox', { name: 'Ответ' }) as HTMLInputElement;
    input.setSelectionRange(1, 1);
    fireEvent.click(screen.getByRole('button', { name: 'Ввести 3' }));
    flush();
    expect(input).toHaveValue('132');
    fireEvent.click(screen.getByRole('button', { name: 'Удалить цифру' }));
    flush();
    expect(input).toHaveValue('12');
    fireEvent.click(screen.getByRole('button', { name: 'Сменить знак' }));
    expect(input).toHaveValue('-12');
    fireEvent.click(screen.getByRole('button', { name: 'Ввести запятую' }));
    expect(input.value).toContain(',');
    vi.unstubAllGlobals();
  });
  it('disables decimal entry for integer-only fields', () => {
    render(<Harness />);
    expect(screen.getByRole('button', { name: 'Ввести запятую' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Сменить знак' })).not.toBeInTheDocument();
  });
});
