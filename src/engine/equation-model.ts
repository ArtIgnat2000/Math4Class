export type EquationKind = 'summand' | 'minuend' | 'subtrahend';
export type EquationCase = { kind: EquationKind; known: number; result: number };

/** The known term and result determine the unknown, whole and both parts. */
export function equationModel(problem: EquationCase) {
  const { kind, known, result } = problem;
  if (!Number.isInteger(known) || !Number.isInteger(result) || known <= 0 || result <= 0)
    throw new Error('Ожидались положительные целые числа');
  if (kind !== 'minuend' && result <= known)
    throw new Error('Сумма или уменьшаемое должны быть больше известной части');
  if (kind === 'summand') {
    const unknown = result - known;
    return {
      whole: result,
      parts: [known, unknown],
      unknownPart: 1,
      unknown,
      equation: `${known} + x = ${result}`,
      calculation: `x = ${result} − ${known}`,
      rule: 'Чтобы найти слагаемое, вычти известную часть из суммы.',
    };
  }
  if (kind === 'minuend') {
    const unknown = result + known;
    return {
      whole: unknown,
      parts: [result, known],
      unknownPart: -1,
      unknown,
      equation: `x − ${known} = ${result}`,
      calculation: `x = ${result} + ${known}`,
      rule: 'Чтобы найти уменьшаемое, сложи разность и вычитаемое.',
    };
  }
  const unknown = result - known;
  return {
    whole: result,
    parts: [known, unknown],
    unknownPart: 1,
    unknown,
    equation: `${result} − x = ${known}`,
    calculation: `x = ${result} − ${known}`,
    rule: 'Чтобы найти вычитаемое, вычти разность из уменьшаемого.',
  };
}

export const EQUATION_SCENES: readonly (readonly [EquationCase, EquationCase])[] = [
  [
    { kind: 'summand', known: 6, result: 14 },
    { kind: 'summand', known: 7, result: 13 },
  ],
  [
    { kind: 'minuend', known: 6, result: 9 },
    { kind: 'minuend', known: 4, result: 8 },
  ],
  [
    { kind: 'subtrahend', known: 7, result: 18 },
    { kind: 'subtrahend', known: 9, result: 17 },
  ],
];

export function equationChoices(problem: EquationCase): number[] {
  const value = equationModel(problem).unknown;
  return [value - 1, value, value + 1];
}
