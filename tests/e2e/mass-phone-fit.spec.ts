import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const sizes = [
  [390, 844],
  [375, 667],
  [320, 640],
  [320, 568],
  [768, 1024],
  [820, 1180],
] as const;
const pack = JSON.parse(
  await readFile(new URL('../../src/content/grade-4.json', import.meta.url), 'utf8'),
);
const topic = pack.topics.find((item: { id: string }) => item.id === 'mass-kg-g');

for (const taskId of ['to-kilo', 'mixed-2-350', 'kg-3']) {
  test(`mass card ${taskId} stays usable on phone and tablet`, async ({ browser }) => {
    const task = topic.tasks.find((item: { id: string }) => item.id === taskId);
    for (const [width, height] of sizes) {
      const context = await browser.newContext({
        viewport: { width, height },
        isMobile: true,
        hasTouch: true,
      });
      try {
        const page = await context.newPage();
        await page.goto('/#/topics');
        await page.locator('.topic-card').filter({ hasText: 'Килограмм и грамм' }).click();
        await page.getByRole('button', { name: 'Начать занятие' }).click();
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
        const layout = await page.evaluate(() => {
          const rect = (selector: string) =>
            document.querySelector(selector)!.getBoundingClientRect();
          return {
            scroll: document.documentElement.scrollHeight,
            bottom: rect('.task-card').bottom,
            keypad: rect('.numeric-keypad').bottom,
            picture: rect('.mass-question-visual').height,
            keys: [...document.querySelectorAll('.numeric-keypad button')].map(
              (button) => button.getBoundingClientRect().height,
            ),
          };
        });
        expect(layout.scroll, `${taskId} ${width}×${height}: page scroll`).toBeLessThanOrEqual(
          height,
        );
        expect(layout.bottom, `${taskId} ${width}×${height}: card bottom`).toBeLessThan(
          height - 12,
        );
        expect(layout.keypad).toBeLessThan(height - 40);
        expect(layout.picture).toBeGreaterThan(50);
        expect(Math.min(...layout.keys)).toBeGreaterThanOrEqual(44);
        await expect(page.getByRole('button', { name: 'Таблица единиц' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Подсказка', exact: true })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Сохранить и выйти' })).toBeVisible();
      } finally {
        await context.close();
      }
    }
  });
}

test('quick reference stays compact while full table opens separately', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  try {
    const page = await context.newPage();
    await page.goto('/#/topics');
    await page.locator('.topic-card').filter({ hasText: 'Килограмм и грамм' }).click();
    await page.getByRole('button', { name: 'Начать занятие' }).click();
    await page.getByRole('button', { name: 'Таблица единиц' }).click();
    const bottom = await page
      .locator('.task-card')
      .evaluate((card) => card.getBoundingClientRect().bottom);
    expect(bottom).toBeLessThan(844 - 12);
    await page.getByRole('button', { name: 'Все единицы массы' }).click();
    await expect(page.getByRole('dialog', { name: 'Таблица единиц массы' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Таблица единиц массы' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Проверить' })).toBeVisible();
  } finally {
    await context.close();
  }
});
