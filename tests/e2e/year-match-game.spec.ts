import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { STORAGE_KEY } from '../../src/state/storage';

for (const [width, height] of [
  [320, 568],
  [390, 844],
  [768, 1024],
  [820, 1180],
] as const) {
  test(`two year games work without answer leaks at ${width}px`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width, height },
      isMobile: true,
      hasTouch: true,
      reducedMotion: 'reduce',
    });
    try {
      const page = await context.newPage();
      await page.goto('/#/topics');
      await page.locator('.topic-card').filter({ hasText: 'Переводим годы в месяцы' }).click();
      const dialog = page.getByRole('dialog');
      for (let step = 1; step <= 3; step++) {
        await expect(
          dialog.getByRole('button', { name: 'Играть — игра «Собери год»' }),
        ).toBeVisible();
        await dialog.getByRole('button', { name: 'Считай — игра «Считаем месяцы»' }).tap();
        const game = dialog.locator('.year-match-game');
        await expect(game.getByText('Сколько месяцев вместе?')).toBeVisible();
        await expect(game).not.toContainText(/\b(?:27|48)\b/);
        const geometry = await game.evaluate((node) => ({
          width: document.documentElement.scrollWidth,
          sizes: [...node.querySelectorAll('button')].map((button) => {
            const box = button.getBoundingClientRect();
            return Math.min(box.width, box.height);
          }),
        }));
        expect(geometry.width).toBeLessThanOrEqual(width);
        for (const size of geometry.sizes) expect(size).toBeGreaterThanOrEqual(44);
        expect((await new AxeBuilder({ page }).include('.modal').analyze()).violations).toEqual([]);
        await game.getByRole('button', { name: '11', exact: true }).tap();
        await expect(game.getByRole('status')).toContainText('В каждом круге 12 месяцев');
        await game.getByRole('button', { name: 'Подсказка' }).tap();
        await expect(game.getByRole('button', { name: '11', exact: true })).toHaveAttribute(
          'aria-pressed',
          'true',
        );
        await game.getByRole('button', { name: '12', exact: true }).tap();
        await game.getByRole('button', { name: 'Дальше' }).tap();
        await expect(game).toContainText('Ещё 1 месяц');
        await expect(game).not.toContainText(/\b(?:27|48)\b/);
        await game.getByRole('button', { name: '25', exact: true }).tap();
        await game.getByRole('button', { name: 'Дальше' }).tap();
        await game.getByRole('button', { name: '36', exact: true }).tap();
        await expect(game.getByRole('status')).toContainText('12 + 12 + 12 = 36 месяцев');
        await expect(game).not.toContainText(/\b(?:27|48)\b/);
        await game.getByRole('button', { name: 'К объяснению' }).tap();
        await expect(dialog.getByLabel(`Шаг ${step} из 3`)).toBeAttached();
        if (step < 3) await dialog.getByRole('button', { name: 'Дальше' }).tap();
      }
      expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBeNull();
      await dialog.getByRole('button', { name: 'Проверить себя' }).tap();
      await expect(page.locator('.task-card')).toBeVisible();
    } finally {
      await context.close();
    }
  });
}
