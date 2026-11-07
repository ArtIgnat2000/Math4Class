/** Whole groups and a remainder smaller than the divisor. */
export type DividendScene = { divisor: number; quotient: number; remainder: number };
export function dividendModel({ divisor, quotient, remainder }: DividendScene) {
  if (
    ![divisor, quotient, remainder].every(Number.isInteger) ||
    divisor < 2 ||
    quotient < 1 ||
    remainder < 0 ||
    remainder >= divisor
  )
    throw new Error('Остаток должен быть неотрицательным и меньше делителя');
  return { groups: divisor * quotient, dividend: divisor * quotient + remainder };
}
export const DIVIDEND_SCENES: readonly DividendScene[] = [
  { divisor: 4, quotient: 3, remainder: 1 },
  { divisor: 5, quotient: 2, remainder: 2 },
  { divisor: 3, quotient: 3, remainder: 2 },
];
