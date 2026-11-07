/** Author's learning scenes, deliberately separate from the approved exercises.
 * The checked answers (27 and 48 months) must never occur in any scene or option. */
export const YEAR_MATCH_SCENES = [
  { years: 1, extra: 0, choices: [11, 12, 13] },
  { years: 2, extra: 1, choices: [24, 25, 26] },
  { years: 3, extra: 0, choices: [35, 36, 37] },
] as const;

export type YearMatchScene = (typeof YEAR_MATCH_SCENES)[number];

export function yearMatchTotal(scene: YearMatchScene): number {
  return scene.years * 12 + scene.extra;
}

export function yearMatchFeedback(scene: YearMatchScene, choice: number): string {
  if (choice !== yearMatchTotal(scene)) {
    return scene.extra
      ? 'В каждом круге 12 месяцев. Прибавь отдельный месяц.'
      : 'В каждом круге 12 месяцев. Сложи месяцы кругов.';
  }
  const sum = Array.from({ length: scene.years }, () => '12').join(' + ');
  return `${sum}${scene.extra ? ` + ${scene.extra}` : ''} = ${yearMatchTotal(scene)} месяцев.`;
}
