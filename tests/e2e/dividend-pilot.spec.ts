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
    // Eighteen axe analyses plus the practice round; the widest viewport needs more than 45 s.
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
            await expect(
              game.getByText('Найдём делимое: сколько всего было предметов?'),
            ).toBeVisible();
            await expect(game.getByText(/Добавь вне групп:/)).toContainText('1 предмет');
            await expect(game.getByText(/«\+ 1» — добавить/)).toContainText('«− 1» — убрать');
            await expect(game.getByText('Добавлено вне групп: 0')).toBeVisible();
            if (width === 320) {
              const modal = (await dialog.boundingBox())!;
              for (const node of [
                game.locator('.dividend-game-instruction'),
                game.locator('.dividend-model'),
                game.locator('.equation-choices'),
              ]) {
                const rect = (await node.boundingBox())!;
                expect(rect.y).toBeGreaterThanOrEqual(modal.y);
                expect(rect.y + rect.height).toBeLessThanOrEqual(modal.y + modal.height);
              }
            }
            await game.getByRole('button', { name: /\+ 1 — добавить предмет/ }).tap();
            await expect(game.getByText('Добавлено вне групп: 1')).toBeVisible();
            await game.getByRole('button', { name: 'Готово' }).tap();
            await expect(game.getByRole('status')).toContainText('12 + 1 = 13. Это делимое.');
            if (width === 320) {
              const modal = (await dialog.boundingBox())!;
              const next = (await game.getByRole('button', { name: 'Дальше' }).boundingBox())!;
              expect(next.x).toBeGreaterThanOrEqual(modal.x);
              expect(next.x + next.width).toBeLessThanOrEqual(modal.x + modal.width);
              expect(next.y + next.height).toBeLessThanOrEqual(modal.y + modal.height);
            }
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

test('remainder trainer works with the keyboard and explains the next round', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#/topics');
  await page.locator('.topic-card').filter({ hasText: 'Восстанавливаем делимое' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: /игра «Собери остаток»/ }).focus();
  await page.keyboard.press('Enter');
  const game = dialog.locator('.dividend-game');
  await game.getByRole('button', { name: /\+ 1 — добавить предмет/ }).focus();
  await page.keyboard.press('Enter');
  await expect(game.getByRole('status')).toHaveText('Теперь нажми «Готово».');
  await game.getByRole('button', { name: 'Готово' }).focus();
  await page.keyboard.press('Enter');
  await expect(game.getByRole('status')).toContainText('12 + 1 = 13. Это делимое.');
  await game.getByRole('button', { name: 'Дальше' }).focus();
  await page.keyboard.press('Enter');
  await expect(game.getByText(/Добавь вне групп:/)).toContainText('2 предмета');
  await expect(game.getByText('Добавлено вне групп: 0')).toBeVisible();
  expect((await new AxeBuilder({ page }).include('.modal').analyze()).violations).toEqual([]);
  expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBeNull();
});
