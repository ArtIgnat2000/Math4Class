import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { STORAGE_KEY } from '../../src/state/storage';

for (const [width, height] of [
  [320, 568],
  [390, 844],
  [768, 1024],
  [820, 1180],
] as const) {
  test(`dividend model and two games at ${width}px`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width, height },
      hasTouch: true,
      isMobile: true,
      reducedMotion: 'reduce',
    });
    try {
      const page = await context.newPage();
      await page.goto('/#/topics');
      await page.locator('.topic-card').filter({ hasText: 'Восстанавливаем делимое' }).click();
      const dialog = page.getByRole('dialog');
      for (let step = 1; step <= 3; step++) {
        await expect(dialog.getByLabel(`Шаг ${step} из 3`)).toBeVisible();
        await dialog.getByRole('button', { name: 'Другой пример' }).tap();
        await expect(dialog).not.toContainText(/\b(?:59|70|80|747)\b/);
        expect((await new AxeBuilder({ page }).include('.modal').analyze()).violations).toEqual([]);
        for (const gameName of ['Найди делимое', 'Собери остаток']) {
          await dialog.getByRole('button', { name: new RegExp(`игра «${gameName}»`) }).tap();
          const game = dialog.locator('.dividend-game');
          await expect(game).not.toContainText(/\b(?:59|70|80|747)\b/);
          const sizes = await game.locator('button').evaluateAll((nodes) =>
            nodes.map((node) => {
              const box = node.getBoundingClientRect();
              return Math.min(box.width, box.height);
            }),
          );
          for (const size of sizes) expect(size).toBeGreaterThanOrEqual(44);
          expect(
            await page.evaluate(() => document.documentElement.scrollWidth),
          ).toBeLessThanOrEqual(width);
          expect((await new AxeBuilder({ page }).include('.modal').analyze()).violations).toEqual(
            [],
          );
          if (gameName === 'Найди делимое') {
            await game.getByRole('button', { name: '12', exact: true }).tap();
            await expect(game.getByRole('status')).toContainText('Сложи');
            await game.getByRole('button', { name: '13', exact: true }).tap();
            await expect(game.getByRole('status')).toContainText('4 × 3 + 1 = 13');
          } else {
            await game.getByRole('button', { name: '+ 1' }).tap();
            await game.getByRole('button', { name: 'Готово' }).tap();
            await expect(game.getByRole('status')).toContainText('12 + 1 = 13');
          }
          await game.getByRole('button', { name: 'К объяснению' }).tap();
          await expect(dialog.getByLabel(`Шаг ${step} из 3`)).toBeVisible();
        }
        if (step < 3) await dialog.getByRole('button', { name: 'Дальше' }).tap();
      }
      expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBeNull();
      await dialog.getByRole('button', { name: 'Проверить себя' }).tap();
      const answer = page.getByLabel('Твой ответ');
      await answer.fill('123');
      await page.getByRole('button', { name: 'Объяснение' }).tap();
      await expect(page.getByRole('dialog')).not.toContainText(/\b(?:59|70|80|747)\b/);
      await page.getByRole('dialog').getByRole('button', { name: 'К заданию' }).tap();
      await expect(answer).toHaveValue('123');
    } finally {
      await context.close();
    }
  });
}
