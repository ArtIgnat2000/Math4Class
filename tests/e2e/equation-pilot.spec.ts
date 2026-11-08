import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { STORAGE_KEY } from '../../src/state/storage';

for (const [width, height] of [
  [320, 568],
  [390, 844],
  [768, 1024],
  [820, 1180],
] as const) {
  test(`equation model and both games work at ${width}px`, async ({ browser }) => {
    // Six axe analyses plus the practice round; the widest viewport needs more than 45 s.
    test.setTimeout(120_000);
    const context = await browser.newContext({
      viewport: { width, height },
      hasTouch: true,
      isMobile: true,
      reducedMotion: 'reduce',
    });
    try {
      const page = await context.newPage();
      await page.goto('/#/topics');
      await page
        .locator('.topic-card')
        .filter({ hasText: 'Уравнения: сложение и вычитание' })
        .click();
      const dialog = page.getByRole('dialog');
      for (let step = 1; step <= 3; step++) {
        await expect(dialog.getByLabel(`Шаг ${step} из 3`)).toBeVisible();
        await dialog.getByRole('button', { name: 'Другой пример' }).tap();
        await expect(dialog).not.toContainText(/\b(?:170|270|900)\b/);
        if (step === 1)
          await expect(dialog.getByRole('button', { name: 'Дальше' })).toBeInViewport();
        for (const gameName of ['Найди число', 'Собери решение']) {
          await dialog.getByRole('button', { name: new RegExp(`игра «${gameName}»`) }).tap();
          const game = dialog.locator('.equation-game');
          await expect(game).not.toContainText(/\b(?:170|270|900)\b/);
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
          if (gameName === 'Найди число') {
            await game.getByRole('button', { name: '7', exact: true }).tap();
            await expect(game.getByRole('status')).toContainText('вычти известную часть');
            await game.getByRole('button', { name: '8', exact: true }).tap();
            await expect(game.getByRole('status')).toContainText('x = 14 − 6 = 8');
          } else {
            await game.getByRole('button', { name: 'x = 8', exact: true }).tap();
            await expect(game.getByRole('status')).toContainText('Сначала');
            await game.getByRole('button', { name: '6 + x = 14' }).tap();
            await game.getByRole('button', { name: 'x = 14 − 6' }).tap();
            await game.getByRole('button', { name: 'x = 8', exact: true }).tap();
            await expect(game.getByRole('button', { name: 'Дальше' })).toBeVisible();
          }
          await game.getByRole('button', { name: 'К объяснению' }).tap();
          await expect(dialog.getByLabel(`Шаг ${step} из 3`)).toBeVisible();
        }
        if (step < 3) await dialog.getByRole('button', { name: 'Дальше' }).tap();
      }
      expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBeNull();
      await dialog.getByRole('button', { name: 'Проверить себя' }).tap();
      await expect(page.locator('.task-card')).toBeVisible();
      const answer = page.getByLabel('Твой ответ');
      await answer.fill('123');
      await page.getByRole('button', { name: 'Объяснение' }).tap();
      await expect(page.getByRole('dialog')).not.toContainText(/\b(?:170|270|900)\b/);
      await page.getByRole('dialog').getByRole('button', { name: 'К заданию' }).tap();
      await expect(answer).toHaveValue('123');
    } finally {
      await context.close();
    }
  });
}
