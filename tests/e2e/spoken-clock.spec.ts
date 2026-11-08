import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { STORAGE_KEY } from '../../src/state/storage';

for (const [width, height] of [
  [320, 568],
  [390, 844],
  [768, 1024],
  [820, 1180],
] as const) {
  test(`spoken time and trainers at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/#/topics');
    await page.locator('.topic-card').filter({ hasText: 'Как называют время словами' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('четверть седьмого')).toBeVisible();
    await expect(dialog.locator('[data-minute-arc="passed"]')).toHaveCount(1);
    await dialog.getByRole('button', { name: 'Другой пример' }).click();
    await expect(dialog.getByText('четверть восьмого')).toBeVisible();
    await dialog.getByRole('button', { name: 'Узнай время' }).click();
    await dialog.getByRole('button', { name: '05:30' }).click();
    await expect(dialog.getByRole('status')).toContainText('Попробуй ещё');
    await dialog.getByRole('button', { name: '04:30' }).click();
    await expect(dialog.getByRole('status')).toContainText('Верно');
    await dialog.getByRole('button', { name: 'Следующее время' }).click();
    await expect(dialog.getByText('четверть седьмого')).toBeVisible();
    await dialog.getByRole('button', { name: 'К объяснению' }).click();
    await expect(dialog.getByText('четверть восьмого')).toBeVisible();
    await dialog.getByRole('button', { name: 'Назови словами' }).click();
    await expect(dialog.getByRole('img', { name: /длинная показывает 30 минут/ })).toBeVisible();
    await dialog.getByRole('button', { name: 'четверть седьмого' }).click();
    await expect(dialog.getByRole('status')).toContainText('Попробуй ещё');
    await dialog.getByRole('button', { name: 'половина пятого' }).click();
    await expect(dialog.getByRole('status')).toContainText('Верно');
    expect((await new AxeBuilder({ page }).include('.modal').analyze()).violations).toEqual([]);
    await dialog.getByRole('button', { name: 'К объяснению' }).click();
    await expect(dialog.getByText('четверть восьмого')).toBeVisible();
    await dialog.getByRole('button', { name: 'Поверни стрелку' }).click();
    const buttons = dialog.getByRole('group', { name: 'Минуты' }).getByRole('button');
    for (const button of await buttons.all()) {
      const box = (await button.boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
    await dialog.getByRole('button', { name: 'Проверить часы' }).click();
    await expect(dialog.getByRole('status')).toContainText('Попробуй ещё');
    await dialog.getByRole('button', { name: '30', exact: true }).click();
    await dialog.getByRole('button', { name: 'Проверить часы' }).click();
    await expect(dialog.getByRole('status')).toContainText('Верно');
    expect((await new AxeBuilder({ page }).include('.modal').analyze()).violations).toEqual([]);
    await dialog.getByRole('button', { name: 'К объяснению' }).click();
    await dialog.getByRole('button', { name: 'Дальше' }).click();
    await dialog.getByRole('button', { name: 'Дальше' }).click();
    await expect(dialog.getByText('без пяти шесть')).toBeVisible();
    await expect(dialog.locator('[data-minute-arc="remaining"]')).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
    expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBeNull();
    await dialog.getByRole('button', { name: 'Проверить себя' }).click();
    await expect(page.locator('.task-card')).toBeVisible();
  });
}

test('spoken-time minute trainer can be operated by keyboard', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#/topics');
  await page.locator('.topic-card').filter({ hasText: 'Как называют время словами' }).click();
  const dialog = page.getByRole('dialog');
  for (const name of ['Поверни стрелку', '30', 'Проверить часы']) {
    await dialog.getByRole('button', { name, exact: true }).focus();
    await page.keyboard.press('Enter');
  }
  await expect(dialog.getByRole('status')).toContainText('Верно');
  await dialog.getByRole('button', { name: 'Следующее время' }).focus();
  await page.keyboard.press('Enter');
  await expect(dialog.getByText('четверть седьмого')).toBeVisible();
});
