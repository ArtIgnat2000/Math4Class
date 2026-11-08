import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createAppData } from '../../src/engine/model';
import { STORAGE_KEY } from '../../src/state/storage';

test('neutral home heading preserves the profile across phones and tablets', async ({ page }) => {
  const data = createAppData();
  data.profiles[0].name = 'маме 35';
  data.profiles[0].totals = { tasks: 3, correct: 2, lessons: 1, xp: 10, recovered: 0, perfect: 0 };
  await page.addInitScript(({ key, saved }) => localStorage.setItem(key, JSON.stringify(saved)), {
    key: STORAGE_KEY,
    saved: data,
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const size of [
    { width: 320, height: 568 },
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 820, height: 1180 },
  ]) {
    await page.setViewportSize(size);
    await page.goto('/#/learn');
    await expect(page.getByRole('heading', { name: 'Твой день открытий' })).toBeVisible();
    await expect(page.getByRole('heading', { name: /маме 35/i })).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      size.width,
    );
    expect((await new AxeBuilder({ page }).include('.learning-page').analyze()).violations).toEqual(
      [],
    );
    const stored = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!),
      STORAGE_KEY,
    );
    expect(stored.profiles[0]).toEqual(data.profiles[0]);
  }
});
