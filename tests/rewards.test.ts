import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  REWARD_ITEMS,
  REWARD_LAST_NEED,
  REWARD_SHELVES,
  REWARD_TIERS,
  REWARD_TOTAL,
  collectionRank,
  isRewardUnlocked,
  normalizeLessons,
  rewardProgress,
  rewardsByShelf,
  rewardsForLesson,
  shelfStats,
  unlockedRewards,
} from '../src/engine/rewards';

describe('коллекция наград: каталог', () => {
  it('переносит все 102 вещи витрины «Слова» с картинками', () => {
    expect(REWARD_TOTAL).toBe(102);
    expect(REWARD_ITEMS).toHaveLength(102);
    expect(new Set(REWARD_ITEMS.map((item) => item.id)).size).toBe(102);
    expect(new Set(REWARD_ITEMS.map((item) => item.title)).size).toBe(102);
    for (const item of REWARD_ITEMS) {
      expect(item.title.length).toBeGreaterThan(0);
      expect(item.need).toBeGreaterThanOrEqual(1);
      expect(item.need).toBeLessThanOrEqual(REWARD_LAST_NEED);
      expect(existsSync(`public/rewards/${item.id}.webp`)).toBe(true);
    }
    expect(REWARD_ITEMS.filter((item) => item.kind === 'outfit')).toHaveLength(38);
    expect(REWARD_ITEMS.filter((item) => item.kind === 'toy')).toHaveLength(64);
  });

  it('раскладывает вещи по полкам без потерь', () => {
    const onShelves = REWARD_SHELVES.flatMap((shelf) => rewardsByShelf(shelf.id));
    expect(onShelves).toHaveLength(REWARD_TOTAL);
    expect(new Set(onShelves.map((item) => item.id)).size).toBe(REWARD_TOTAL);
    for (const shelf of REWARD_SHELVES) {
      expect(rewardsByShelf(shelf.id).length).toBeGreaterThan(0);
    }
  });

  it('выдаёт вещи по возрастанию цены исходной витрины', () => {
    const prices = REWARD_ITEMS.map((item) => item.price);
    expect([...prices].sort((a, b) => a - b)).toEqual(prices);
  });
});

describe('коллекция наград: лестница занятий', () => {
  it('лестница покрывает весь каталог и возрастает', () => {
    expect(REWARD_TIERS.reduce((sum, tier) => sum + tier.count, 0)).toBe(REWARD_TOTAL);
    const needs = REWARD_TIERS.map((tier) => tier.need);
    expect(needs).toEqual([...needs].sort((a, b) => a - b));
    expect(new Set(needs).size).toBe(needs.length);
    expect(needs[0]).toBe(1);
    expect(needs.at(-1)).toBe(REWARD_LAST_NEED);
    for (const tier of REWARD_TIERS) {
      expect(rewardsForLesson(tier.need)).toHaveLength(tier.count);
    }
  });

  it('первые двадцать занятий дают награду без пропусков', () => {
    for (let lesson = 1; lesson <= 20; lesson++) {
      expect(rewardsForLesson(lesson)).toHaveLength(1);
    }
  });

  it('чем больше занятий, тем больше наград — без откатов', () => {
    let previous = 0;
    for (let lesson = 0; lesson <= REWARD_LAST_NEED; lesson++) {
      const unlocked = unlockedRewards(lesson).length;
      expect(unlocked).toBeGreaterThanOrEqual(previous);
      previous = unlocked;
    }
    expect(unlockedRewards(0)).toHaveLength(0);
    expect(unlockedRewards(REWARD_LAST_NEED)).toHaveLength(REWARD_TOTAL);
    expect(unlockedRewards(REWARD_LAST_NEED + 50)).toHaveLength(REWARD_TOTAL);
    expect(unlockedRewards(20)).toHaveLength(20);
    expect(unlockedRewards(200).length).toBeGreaterThan(unlockedRewards(100).length);
  });

  it('испорченные числа не ломают витрину', () => {
    expect(normalizeLessons(Number.NaN)).toBe(0);
    expect(normalizeLessons(-7)).toBe(0);
    expect(normalizeLessons(3.9)).toBe(3);
    expect(rewardsForLesson(-1)).toEqual([]);
    expect(rewardsForLesson(Number.POSITIVE_INFINITY)).toEqual([]);
  });
});

describe('коллекция наград: прогресс и звания', () => {
  it('показывает следующий набор и остаток занятий', () => {
    const progress = rewardProgress(5);
    expect(progress.lessons).toBe(5);
    expect(progress.unlocked).toBe(5);
    expect(progress.total).toBe(102);
    expect(progress.next).not.toBeNull();
    expect(progress.next!.need).toBe(6);
    expect(progress.next!.left).toBe(1);
    expect(progress.next!.items).toHaveLength(1);
    expect(progress.percent).toBeGreaterThanOrEqual(0);
    expect(progress.percent).toBeLessThanOrEqual(100);
    expect(progress.upcoming[0].need).toBe(6);
  });

  it('на последнем наборе коллекция считается собранной', () => {
    const progress = rewardProgress(REWARD_LAST_NEED);
    expect(progress.next).toBeNull();
    expect(progress.percent).toBe(100);
    expect(progress.unlocked).toBe(REWARD_TOTAL);
    expect(progress.upcoming).toEqual([]);
  });

  it('звание растёт вместе с коллекцией', () => {
    expect(collectionRank(0).title).toBe('Новичок коллекции');
    expect(collectionRank(3).title).toBe('Собиратель');
    expect(collectionRank(REWARD_TOTAL).title).toBe('Легенда «Числа»');
    expect(collectionRank(REWARD_TOTAL).nextAt).toBeNull();
    expect(collectionRank(999).title).toBe('Легенда «Числа»');
    expect(collectionRank(0).nextAt).toBe(3);
  });

  it('считает открытые вещи каждой полки', () => {
    const stats = shelfStats('outfits', 5);
    expect(stats.total).toBe(38);
    expect(stats.unlocked).toBeGreaterThan(0);
    expect(stats.unlocked).toBeLessThan(stats.total);
    expect(isRewardUnlocked(rewardsByShelf('outfits')[0], 5)).toBe(true);
  });
});
