/**
 * Разряды в числовом ответе: «860 000» вместо «860000».
 *
 * В состоянии урока ответ хранится без пробелов — проверка, сохранение и импорт не меняются.
 * Пробелы появляются только на экране, а курсор переводится между двумя представлениями,
 * чтобы ввод в середине числа работал как обычно.
 */
const GROUP_SEPARATOR = ' ';
const SPACES = /[\s\u00a0\u202f]/g;

/** Оставляет только то, что имеет смысл в ответе: цифры, минус и одну запятую. */
export function normalizeNumericInput(text: string): string {
  const compact = text.replace(SPACES, '').replace(/[−–—]/g, '-');
  const negative = compact.startsWith('-');
  const body = compact.replace(/-/g, '').replace(/\./g, ',');
  const [whole = '', ...rest] = body.split(',');
  const digits = whole.replace(/\D/g, '');
  const fraction = rest.join('').replace(/\D/g, '');
  const value = rest.length > 0 ? `${digits},${fraction}` : digits;
  if (!value) return negative ? '-' : '';
  return negative ? `-${value}` : value;
}

export type NumericInputDisplay = {
  /** Строка для показа в поле: «1 234 567,5». */
  text: string;
  /** positions[i] — место в `text` сразу после i-го символа ответа без пробелов. */
  positions: number[];
};

/** Разбивает целую часть на триады и запоминает, где окажется курсор. */
export function numericInputDisplay(raw: string): NumericInputDisplay {
  const value = normalizeNumericInput(raw);
  const negative = value.startsWith('-');
  const body = negative ? value.slice(1) : value;
  const commaAt = body.indexOf(',');
  const whole = commaAt === -1 ? body : body.slice(0, commaAt);
  const fraction = commaAt === -1 ? null : body.slice(commaAt + 1);
  let text = '';
  const positions: number[] = [0];
  if (negative) {
    text = '-';
    positions.push(text.length);
  }
  for (let i = 0; i < whole.length; i++) {
    if (i > 0 && (whole.length - i) % 3 === 0) text += GROUP_SEPARATOR;
    text += whole[i];
    positions.push(text.length);
  }
  if (fraction !== null) {
    text += ',';
    positions.push(text.length);
    for (const digit of fraction) {
      text += digit;
      positions.push(text.length);
    }
  }
  return { text, positions };
}

/** Готовая строка для поля ввода. */
export function groupNumericInput(raw: string): string {
  return numericInputDisplay(raw).text;
}

/** Место курсора в строке с пробелами по позиции в ответе без пробелов. */
export function displayIndexFromRaw(raw: string, index: number): number {
  const { text, positions } = numericInputDisplay(raw);
  const clamped = Math.max(0, Math.min(index, positions.length - 1));
  return Math.min(positions[clamped], text.length);
}

/** Позиция в ответе без пробелов по месту курсора в строке с пробелами. */
export function rawIndexFromDisplay(display: string, index: number): number {
  const cut = Math.max(0, Math.min(index, display.length));
  return normalizeNumericInput(display.slice(0, cut)).length;
}
