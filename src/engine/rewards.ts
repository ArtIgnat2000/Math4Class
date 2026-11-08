// ── Поощрение: коллекция скинов и вещей за пройденные занятия ───────────────
//
// Ребёнок не покупает награды и не копит валюту: вещь открывается сама, когда
// пройдено нужное число занятий. Чем больше занятий — тем больше наград, причём
// первые двадцать занятий дают по награде, чтобы бонус было видно сразу.
//
// Каталог (102 вещи из витрины «Слова») и лестница порогов лежат в
// engine/reward-catalog.ts. Здесь только правила: что уже открыто, что
// откроется следующим и сколько занятий до него осталось. Логика чистая,
// без React и без записи в профиль: награды выводятся из profile.totals.lessons,
// поэтому старые сохранения не требуют миграции, а награду нельзя «потерять».

import {
  REWARD_ITEMS,
  REWARD_SHELVES,
  REWARD_TIERS,
  type RewardItem,
  type RewardShelf,
  type RewardShelfInfo,
} from './reward-catalog';

export { REWARD_ITEMS, REWARD_SHELVES, REWARD_TIERS };
export type { RewardItem, RewardShelf, RewardShelfInfo };

/** Сколько всего наград в коллекции. */
export const REWARD_TOTAL = REWARD_ITEMS.length;

/** Занятий, после которых коллекция собрана полностью. */
export const REWARD_LAST_NEED = REWARD_TIERS.at(-1)?.need ?? 0;

/** Вещи одного набора, сгруппированные по порогу. */
const ITEMS_BY_NEED: Map<number, RewardItem[]> = new Map();
for (const item of REWARD_ITEMS) {
  const bucket = ITEMS_BY_NEED.get(item.need);
  if (bucket) bucket.push(item);
  else ITEMS_BY_NEED.set(item.need, [item]);
}

/** Пороги по возрастанию — ими пользуется и прогресс, и витрина. */
const NEEDS = REWARD_TIERS.map((tier) => tier.need);

/**
 * Пройденные занятия как целое неотрицательное число.
 * Испорченное значение из чужого сохранения не должно ломать витрину.
 */
export function normalizeLessons(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.floor(value);
}

/** Все вещи, которые открываются ровно на этом занятии. */
export function rewardsForLesson(lesson: number): RewardItem[] {
  return ITEMS_BY_NEED.get(normalizeLessons(lesson)) ?? [];
}

/** Что уже открыто: вещи, чей порог не больше числа пройденных занятий. */
export function unlockedRewards(lessons: number): RewardItem[] {
  const done = normalizeLessons(lessons);
  return REWARD_ITEMS.filter((item) => item.need <= done);
}

/** Открыта ли конкретная вещь. */
export function isRewardUnlocked(item: RewardItem, lessons: number): boolean {
  return item.need <= normalizeLessons(lessons);
}

/** Сколько вещей открывает занятие с этим номером (для подписи «+2»). */
export function rewardSetSize(need: number): number {
  return ITEMS_BY_NEED.get(need)?.length ?? 0;
}

export interface RewardNext {
  /** Номер занятия, на котором откроется набор. */
  need: number;
  /** Вещи набора — витрина показывает их превью. */
  items: RewardItem[];
  /** Сколько занятий осталось пройти. */
  left: number;
}

export interface RewardProgress {
  lessons: number;
  unlocked: number;
  total: number;
  /** Прогресс до следующего набора, 0–100. На последнем наборе — 100. */
  percent: number;
  /** Следующий набор или null, если коллекция собрана. */
  next: RewardNext | null;
  /** Ближайшие неоткрытые вещи по порядку (до трёх) — «что дальше». */
  upcoming: RewardItem[];
}

/**
 * Состояние коллекции по числу пройденных занятий.
 *
 * Проценты считаются внутри текущей ступени: между предыдущим порогом и
 * следующим, иначе полоска стояла бы почти на нуле всю дорогу.
 */
export function rewardProgress(lessons: number): RewardProgress {
  const done = normalizeLessons(lessons);
  const unlocked = REWARD_ITEMS.filter((item) => item.need <= done).length;
  const nextNeed = NEEDS.find((need) => need > done);
  const previousNeed = [...NEEDS].reverse().find((need) => need <= done) ?? 0;
  const next =
    nextNeed === undefined
      ? null
      : {
          need: nextNeed,
          items: ITEMS_BY_NEED.get(nextNeed) ?? [],
          left: nextNeed - done,
        };
  const percent =
    nextNeed === undefined
      ? 100
      : Math.max(
          0,
          Math.min(100, ((done - previousNeed) / Math.max(1, nextNeed - previousNeed)) * 100),
        );
  return {
    lessons: done,
    unlocked,
    total: REWARD_TOTAL,
    percent,
    next,
    upcoming: REWARD_ITEMS.filter((item) => item.need > done).slice(0, 3),
  };
}

export interface CollectionRank {
  index: number;
  title: string;
  /** Сколько наград нужно для следующего звания (null — уже максимум). */
  nextAt: number | null;
}

/** Звания коллекции: растут вместе с числом открытых вещей. */
const RANKS: { at: number; title: string }[] = [
  { at: 0, title: 'Новичок коллекции' },
  { at: 3, title: 'Собиратель' },
  { at: 10, title: 'Коллекционер' },
  { at: 25, title: 'Знаток наград' },
  { at: 50, title: 'Хранитель коллекции' },
  { at: 80, title: 'Мастер коллекции' },
  { at: REWARD_TOTAL, title: 'Легенда «Числа»' },
];

/** Текущее звание по числу открытых вещей. */
export function collectionRank(unlocked: number): CollectionRank {
  const count = Math.min(normalizeLessons(unlocked), REWARD_TOTAL);
  let index = 0;
  for (let i = 0; i < RANKS.length; i++) if (count >= RANKS[i].at) index = i;
  return {
    index,
    title: RANKS[index].title,
    nextAt: index < RANKS.length - 1 ? RANKS[index + 1].at : null,
  };
}

/** Вещи полки в порядке выдачи. */
export function rewardsByShelf(shelf: RewardShelf): RewardItem[] {
  return REWARD_ITEMS.filter((item) => item.shelf === shelf);
}

/** Сколько вещей полки уже открыто — для подписи полки. */
export function shelfStats(
  shelf: RewardShelf,
  lessons: number,
): { unlocked: number; total: number } {
  const items = rewardsByShelf(shelf);
  return {
    unlocked: items.filter((item) => item.need <= normalizeLessons(lessons)).length,
    total: items.length,
  };
}
