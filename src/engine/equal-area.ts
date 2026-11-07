/** A square cut by one or both diagonals into congruent triangles. */
export function equalArea(side: number, parts: 2 | 4, selected = 1) {
  if (
    ![side, parts, selected].every(Number.isInteger) ||
    side < 1 ||
    (parts !== 2 && parts !== 4) ||
    selected < 0 ||
    selected > parts
  )
    throw new Error('Недопустимая сторона или число частей');
  const whole = side * side;
  return { whole, part: whole / parts, selectedArea: (whole / parts) * selected };
}
export const AREA_SIDES = [6, 10] as const;
