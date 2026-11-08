import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { STORAGE_KEY } from '../../src/state/storage';

for (const [width, height] of [
  [320, 568],
  [390, 844],
  [768, 1024],
  [820, 1180],
] as const) {
  test(`clock models and games work without overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/#/topics');
    await page.locator('.topic-card').filter({ hasText: 'Время от 0 до 24 часов' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('04:00')).toBeVisible();
    await dialog.getByRole('button', { name: 'После полудня' }).click();
    await expect(dialog.getByText('16:00')).toBeVisible();
    await dialog.getByRole('button', { name: 'Прочитай часы' }).click();
    await expect(dialog.getByText('Вечер. Какая запись подходит? Нажми её.')).toBeVisible();
    expect((await new AxeBuilder({ page }).include('.modal').analyze()).violations).toEqual([]);
    await dialog.getByRole('button', { name: '08:00' }).click();
    await expect(dialog.getByRole('status')).toContainText('Попробуй ещё');
    await dialog.getByRole('button', { name: '20:00' }).click();
    await expect(dialog.getByRole('status')).toContainText('Верно!');
    await expect(dialog.getByRole('status')).toContainText('20:00');
    await dialog.getByRole('button', { name: 'К объяснению' }).click();
    await expect(dialog.getByText('16:00')).toBeVisible();
    await dialog.getByRole('button', { name: 'Настрой часы' }).click();
    await expect(
      dialog.getByText('Настрой часы на 17:00. Выбери час и половину суток.'),
    ).toBeVisible();
    if (width === 320) {
      const check = dialog.getByRole('button', { name: 'Проверить часы' });
      const bounds = await check.evaluate((el) => {
        const box = el.getBoundingClientRect();
        const modal = el.closest('.modal')!.getBoundingClientRect();
        return {
          top: box.top,
          bottom: box.bottom,
          modalTop: modal.top,
          modalBottom: modal.bottom,
          height: box.height,
        };
      });
      expect(bounds.height).toBeGreaterThanOrEqual(44);
      expect(bounds.top).toBeGreaterThanOrEqual(bounds.modalTop);
      expect(bounds.bottom).toBeLessThanOrEqual(bounds.modalBottom);
    }
    await dialog.getByRole('button', { name: 'Проверить часы' }).click();
    await expect(dialog.getByRole('status')).toContainText('Попробуй ещё');
    if (width === 320) {
      const bounds = await dialog.getByRole('status').evaluate((el) => {
        const box = el.getBoundingClientRect();
        const modal = el.closest('.modal')!.getBoundingClientRect();
        return { top: box.top, bottom: box.bottom, modalTop: modal.top, modalBottom: modal.bottom };
      });
      expect(bounds.top).toBeGreaterThanOrEqual(bounds.modalTop);
      expect(bounds.bottom).toBeLessThanOrEqual(bounds.modalBottom);
    }
    await dialog.getByRole('button', { name: '5', exact: true }).click();
    await dialog.getByRole('button', { name: 'После полудня' }).click();
    await dialog.getByRole('button', { name: 'Проверить часы' }).click();
    await expect(dialog.getByRole('status')).toContainText('Верно!');
    await expect(dialog.getByRole('status')).toContainText('17:00');
    expect((await new AxeBuilder({ page }).include('.modal').analyze()).violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
    expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBeNull();
  });
}

test('clock theory and games are accessible by keyboard and practice is separate', async ({
  page,
}) => {
  await page.goto('/#/topics');
  await page.locator('.topic-card').filter({ hasText: 'Время от 0 до 24 часов' }).click();
  const dialog = page.getByRole('dialog');
  for (const name of ['После полудня', 'Дальше', 'Другой час', 'Дальше', 'Другие минуты']) {
    await dialog.getByRole('button', { name, exact: true }).focus();
    await page.keyboard.press('Enter');
  }
  await expect(dialog.getByText('06:20')).toBeVisible();
  await dialog.getByRole('button', { name: 'Проверить себя' }).click();
  await expect(page.locator('.task-card')).toBeVisible();
});
