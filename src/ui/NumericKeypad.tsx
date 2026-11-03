import type { RefObject } from 'react';

type Key = 'backspace' | 'minus' | 'decimal' | `${number}`;

/** Hardware keyboards remain usable; on touch devices this replaces the OS keyboard. */
export function NumericKeypad({
  value,
  onChange,
  inputRef,
  allowDecimal = false,
  allowNegative = false,
  disabled = false,
}: {
  value: string;
  onChange: (next: string) => void;
  inputRef: RefObject<HTMLInputElement | null>;
  allowDecimal?: boolean;
  allowNegative?: boolean;
  disabled?: boolean;
}) {
  function press(key: Key) {
    if (disabled) return;
    const input = inputRef.current;
    const start = input?.selectionStart ?? value.length;
    const end = input?.selectionEnd ?? value.length;
    let next: string;
    let caret: number;
    if (key === 'backspace') {
      const from = start === end ? Math.max(0, start - 1) : start;
      next = value.slice(0, from) + value.slice(end);
      caret = from;
    } else if (key === 'minus') {
      next = value.startsWith('-') ? value.slice(1) : `-${value}`;
      caret = Math.max(0, start + (next.startsWith('-') ? 1 : -1));
    } else {
      if (key === 'decimal' && /[.,]/.test(value)) return;
      const inserted = key === 'decimal' ? ',' : key;
      next = value.slice(0, start) + inserted + value.slice(end);
      caret = start + inserted.length;
    }
    if (next.length > 32) return;
    onChange(next);
    requestAnimationFrame(() => {
      input?.focus({ preventScroll: true });
      input?.setSelectionRange(caret, caret);
    });
  }
  return (
    <div className="numeric-keypad" role="group" aria-label="Цифровая клавиатура">
      {(['1', '2', '3', '4', '5', '6', '7', '8', '9'] as const).map((digit) => (
        <button
          type="button"
          key={digit}
          disabled={disabled}
          onClick={() => press(digit)}
          aria-label={`Ввести ${digit}`}
        >
          {digit}
        </button>
      ))}
      <button
        type="button"
        disabled={disabled || !allowDecimal}
        onClick={() => press('decimal')}
        aria-label="Ввести запятую"
      >
        ,
      </button>
      <button type="button" disabled={disabled} onClick={() => press('0')} aria-label="Ввести 0">
        0
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => press('backspace')}
        aria-label="Удалить цифру"
      >
        ⌫
      </button>
      {allowNegative && (
        <button
          type="button"
          className="numeric-keypad-minus"
          disabled={disabled}
          onClick={() => press('minus')}
          aria-label="Сменить знак"
        >
          ±
        </button>
      )}
    </div>
  );
}
