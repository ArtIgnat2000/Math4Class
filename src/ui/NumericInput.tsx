import { useLayoutEffect, useRef, type RefObject } from 'react';
import {
  displayIndexFromRaw,
  groupNumericInput,
  normalizeNumericInput,
  rawIndexFromDisplay,
} from '../engine/number-input';

/**
 * Поле числового ответа: разряды разделяются пробелами прямо во время ввода.
 * В состоянии урока остаётся ответ без пробелов, поэтому проверка не меняется.
 */
export function NumericInput({
  id,
  value,
  onChange,
  inputRef,
  inputMode = 'decimal',
  maxLength = 32,
  placeholder,
  describedBy,
  disabled = false,
  onFocus,
}: {
  id?: string;
  value: string;
  onChange: (next: string) => void;
  inputRef: RefObject<HTMLInputElement | null>;
  inputMode?: 'none' | 'numeric' | 'decimal';
  maxLength?: number;
  placeholder?: string;
  describedBy?: string;
  disabled?: boolean;
  onFocus?: () => void;
}) {
  // Пробелы не входят в ответ, поэтому позиция курсора задаётся после перерисовки.
  const pendingCaret = useRef<number | null>(null);
  useLayoutEffect(() => {
    const input = inputRef.current;
    const caret = pendingCaret.current;
    pendingCaret.current = null;
    if (!input || caret === null) return;
    input.setSelectionRange(caret, caret);
  });
  const display = groupNumericInput(value);
  return (
    <input
      ref={inputRef}
      id={id}
      type="text"
      inputMode={inputMode}
      autoComplete="off"
      // Запас под пробелы между разрядами: ограничение считаем по самому ответу.
      maxLength={maxLength * 2}
      placeholder={placeholder}
      aria-describedby={describedBy}
      disabled={disabled}
      onFocus={onFocus}
      value={display}
      onChange={(event) => {
        const input = event.currentTarget;
        const caret = input.selectionStart ?? input.value.length;
        const rawCaret = rawIndexFromDisplay(input.value, caret);
        const next = normalizeNumericInput(input.value).slice(0, maxLength);
        if (next !== value) {
          onChange(next);
          pendingCaret.current = displayIndexFromRaw(next, rawCaret);
          return;
        }
        // Строка ответа не изменилась: либо стёрли только пробел, либо ввели лишний символ.
        if (input.value.length < display.length && rawCaret > 0) {
          const withoutDigit = value.slice(0, rawCaret - 1) + value.slice(rawCaret);
          onChange(withoutDigit);
          pendingCaret.current = displayIndexFromRaw(withoutDigit, rawCaret - 1);
          return;
        }
        const restore = displayIndexFromRaw(value, rawCaret);
        input.value = display;
        input.setSelectionRange(restore, restore);
      }}
    />
  );
}
