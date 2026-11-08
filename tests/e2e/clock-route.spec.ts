import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { STORAGE_KEY } from '../../src/state/storage';

for (const [width, height] of [
  [320, 568],
  [390, 844],
  [768, 1024],
  [820, 1180],
] as const) {
  test(`route game works at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/#/topics');
    await page.locator('.topic-card').filter({ hasText: 'Как называют время словами' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Маршрут по часу' }).click();
    await expect(dialog.getByText('Выбери начало и шагай по 5 мин.')).toBeVisible();
    await expect(dialog.getByText('Начнётся прогулка в')).toBeVisible();
    const game = dialog.locator('.clock-route-game');
    await expect(game.getByRole('status')).toContainText('Сейчас 07:10');
    for (const button of await game.getByRole('button').all()) {
      if (!(await button.isVisible())) continue;
      const box = (await button.boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
    if (width === 320) {
      const bounds = await game
        .getByRole('button', { name: 'Вперёд на 5 минут' })
        .evaluate((button) => {
          const b = button.getBoundingClientRect();
          const modal = button.closest('.modal')!.getBoundingClientRect();
          return { top: b.top, bottom: b.bottom, modalTop: modal.top, modalBottom: modal.bottom };
        });
      expect(bounds.top).toBeGreaterThanOrEqual(bounds.modalTop);
      expect(bounds.bottom).toBeLessThanOrEqual(bounds.modalBottom);
    }
    await game.getByRole('button', { name: 'Вперёд на 5 минут' }).click();
    await expect(game.getByRole('status')).toContainText('Прошло: 5 мин');
    await expect(game.getByRole('status')).toContainText('До события: 20 мин');
    await expect(game.locator('[data-route-arc="passed"]')).toHaveCount(1);
    await expect(game.locator('[data-route-arc="remaining"]')).toHaveCount(1);
    expect((await new AxeBuilder({ page }).include('.modal').analyze()).violations).toEqual([]);
    await game.getByRole('button', { name: 'Начало 07:40' }).click();
    for (let i = 0; i < 5; i++)
      await game.getByRole('button', { name: 'Вперёд на 5 минут' }).click();
    await expect(game.getByRole('status')).toContainText('Сейчас 08:05');
    await expect(game.getByRole('status')).toContainText('Событие началось');
    await expect(game.getByRole('button', { name: 'Вперёд на 5 минут' })).toBeDisabled();
    await game.getByRole('button', { name: 'Назад на 5 минут' }).click();
    await expect(game.getByRole('status')).toContainText('Сейчас 08:00');
    await game.getByRole('button', { name: 'Заново' }).click();
    await expect(game.getByRole('status')).toContainText('Сейчас 07:40');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
    expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBeNull();
    await game.getByRole('button', { name: 'К объяснению' }).click();
    await expect(dialog.getByText('четверть седьмого')).toBeVisible();
  });
}

test('route controls work with keyboard and reset when the route changes', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#/topics');
  await page.locator('.topic-card').filter({ hasText: 'Как называют время словами' }).click();
  const dialog = page.getByRole('dialog');
  for (const name of [
    'Маршрут по часу',
    'Начало 10:50',
    'Вперёд на 5 минут',
    'Вперёд на 5 минут',
  ]) {
    await dialog.getByRole('button', { name }).focus();
    await page.keyboard.press('Enter');
  }
  await expect(dialog.getByRole('status')).toContainText('Сейчас 11:00');
  await expect(dialog.getByRole('status')).toContainText('Прошло: 10 мин');
  await dialog.getByRole('button', { name: 'Начало 07:10' }).focus();
  await page.keyboard.press('Enter');
  await expect(dialog.getByRole('status')).toContainText('Сейчас 07:10');
});
