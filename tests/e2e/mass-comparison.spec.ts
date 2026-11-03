import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const pack = JSON.parse(
  await readFile(new URL('../../src/content/grade-4.json', import.meta.url), 'utf8'),
);
const topic = pack.topics.find((item: { id: string }) => item.id === 'mass-conversion-comparison');
const scenes: Record<string, number> = {
  centner: 3,
  tonne: 3,
  grams: 5,
  'equal-kg': 6,
  'mixed-tons': 3,
  'mixed-g': 7,
  'same-tonnes': 4,
};

for (const [width, height] of [
  [320, 640],
  [390, 844],
  [768, 1024],
  [820, 1180],
] as const) {
  test(`comparison lesson illustrates each task at ${width}px`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width, height },
      isMobile: true,
      hasTouch: true,
    });
    try {
      const page = await context.newPage();
      await page.goto('/#/topics');
      await page.locator('.topic-card').filter({ hasText: 'Сравниваем единицы массы' }).click();
      await expect(page.getByRole('dialog')).toContainText('1 кг');
      await expect(page.getByRole('dialog')).toContainText('1 ц');
      await expect(page.getByRole('dialog')).toContainText('1 т');
      await expect(page.getByRole('dialog').locator('.comparison-intro-anchors img')).toHaveCount(
        3,
      );
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
        if (task.id === 'heaviest') {
          await expect(page.locator('.mass-comparison-visual')).toHaveCount(0);
          await expect(page.locator('.choice-option .comparison-choice-picture img')).toHaveCount(
            3,
          );
        } else {
          const picture = page.locator('.mass-comparison-visual');
          await expect(picture).toBeVisible();
          await expect(picture.locator('.comparison-prop img')).toHaveCount(scenes[task.id]);
          await expect(picture.locator('.comparison-prop img').first()).toHaveJSProperty(
            'complete',
            true,
          );
          const description = await picture.getAttribute('aria-label');
          expect(description).not.toContain(task.answer?.toString());
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
          width,
        );
        if (width >= 768 && task.type === 'number') {
          const bottom = await page
            .locator('.task-card')
            .evaluate((card) => card.getBoundingClientRect().bottom);
          expect(bottom, `${task.id} keypad card should fit with 48px reserve`).toBeLessThan(
            height - 48,
          );
        }
        await expect(page.getByRole('button', { name: 'Сохранить и выйти' })).toBeVisible();
      }
    } finally {
      await context.close();
    }
  });
}
