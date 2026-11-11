import { expect, test } from '@playwright/test';

test('opens the time-unit table and keeps it readable on a narrow phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/#/topics');
  await page.locator('.topic-card').filter({ hasText: 'Таблица единиц времени' }).click();

  const dialog = page.getByRole('dialog');
  const table = dialog.getByRole('table', { name: 'Соотношения между единицами времени' });
  await expect(table).toBeVisible();
  await expect(table).toContainText('1 век = 100 лет');
  await expect(table).toContainText('1 минута = 60 секунд');
  const help = dialog.getByRole('button', { name: 'Справка' });
  await help.click();
  await expect(dialog.getByText(/В обычном году 365 суток/)).toBeVisible();
  await expect(dialog.getByText(/в феврале — 28 или 29/)).toBeVisible();
  await help.click();
  const illustrations = dialog.locator('.time-units-figure img');
  await expect(illustrations).toHaveCount(7);
  for (const illustration of await illustrations.all()) {
    await illustration.scrollIntoViewIfNeeded();
    await expect(illustration).toHaveJSProperty('naturalWidth', 1254);
  }
  const start = dialog.getByRole('button', { name: 'Начать занятие' });
  await start.scrollIntoViewIfNeeded();
  await expect(start).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);

  await dialog.getByRole('button', { name: 'Начать занятие' }).click();
  await expect(page.locator('.task-card')).toBeVisible();
});
