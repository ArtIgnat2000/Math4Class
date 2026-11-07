export type DecimalKind = 'powers' | 'place';
export type DecimalScene = { left: number; operation: '×' | ':' | '+' | '−'; right: number };
export const DECIMAL_SCENES: Record<
  DecimalKind,
  readonly (readonly [DecimalScene, DecimalScene])[]
> = {
  powers: [
    [
      { left: 24, operation: '×', right: 10 },
      { left: 36, operation: '×', right: 10 },
    ],
    [
      { left: 24, operation: '×', right: 1000 },
      { left: 31, operation: '×', right: 100 },
    ],
    [
      { left: 4200, operation: ':', right: 100 },
      { left: 560, operation: ':', right: 10 },
    ],
  ],
  place: [
    [
      { left: 3421, operation: '+', right: 204 },
      { left: 2514, operation: '+', right: 103 },
    ],
    [
      { left: 7632, operation: '−', right: 200 },
      { left: 4537, operation: '−', right: 300 },
    ],
    [
      { left: 5624, operation: '−', right: 20 },
      { left: 3718, operation: '−', right: 10 },
    ],
  ],
};
export function decimalModel(scene: DecimalScene) {
  const { left, right, operation } = scene;
  if (!Number.isInteger(left) || !Number.isInteger(right) || left < 0 || right <= 0)
    throw new Error('Ожидались целые неотрицательные числа');
  const result =
    operation === '×'
      ? left * right
      : operation === ':'
        ? left / right
        : operation === '+'
          ? left + right
          : left - right;
  if (!Number.isInteger(result) || result < 0 || result > 99999 || left > 99999)
    throw new Error('Число вне диапазона модели');
  return {
    result,
    digits: Array.from(String(result), Number),
    input: Array.from(String(left).padStart(5, '0'), Number),
    output: Array.from(String(result).padStart(5, '0'), Number),
  };
}
export const PLACE_NAMES = ['десятки тысяч', 'тысячи', 'сотни', 'десятки', 'единицы'] as const;
export function formatDecimal(value: number) {
  return value.toLocaleString('ru-RU');
}
