import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const pack = JSON.parse(
  await readFile(new URL('../../src/content/grade-4.json', import.meta.url), 'utf8'),
);
const topic = pack.topics.find((item: { id: string }) => item.id === 'mass-word-problems');
const expectedImages: Record<string, number> = {
  'paper-centner': 3,
  'paper-tonne': 3,
  'wagons-total': 2,
  'wagons-difference': 2,
  bread: 2,
  bags: 2,
  remaining: 2,
  expression: 2,
};

for (const [width, height] of [
  [320, 640],
  [390, 844],
  [768, 1024],
  [820, 1180],
] as const) {
  test(`mass word problems keep their subject illustrations at ${width}px`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width, height },
      isMobile: true,
      hasTouch: true,
    });
    try {
      const page = await context.newPage();
      await page.goto('/#/topics');
      await page.locator('.topic-card').filter({ hasText: 'Задачи на массу' }).click();
      await expect(page.getByRole('dialog').locator('.word-mass-intro img')).toHaveCount(3);
      await page.getByRole('button', { name: 'Начать занятие' }).click();
      for (const task of topic.tasks) {
        await page.evaluate((selectedTask) => {
          const key = 'chislo:data:v1';
          const data = JSON.parse(localStorage.getItem(key)!);
          const profile = data.profiles.find(
            (item: { id: string }) => item.id === data.activeProfileId,
          );
          profile.activeSession.entries[0] = { task: selectedTask, retry: false };
          profile.activeSession.cursor = 0;
          localStorage.setItem(key, JSON.stringify(data));
        }, task);
        await page.reload();
        const picture = page.getByRole('img', {
          name: /макулатуры|вагонов|смену|мешок|Было 2 тонны|ящиков яблок/,
        });
        await expect(picture).toBeVisible();
        await expect(picture.locator('.word-mass-object img')).toHaveCount(expectedImages[task.id]);
        for (const img of await picture.locator('img').all()) {
          await expect(img).toHaveJSProperty('complete', true);
          expect(
            await img.evaluate((element: HTMLImageElement) => element.naturalWidth),
          ).toBeGreaterThan(0);
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
          width,
        );
        if (width >= 768 && task.type === 'number') {
          const bottom = await page
            .locator('.task-card')
            .evaluate((card) => card.getBoundingClientRect().bottom);
          expect(bottom, `${task.id}: leave 48px below keypad`).toBeLessThan(height - 48);
        }
      }
    } finally {
      await context.close();
    }
  });
}
