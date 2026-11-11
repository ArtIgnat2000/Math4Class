import { expect, test } from '@playwright/test';

test('keeps the compact title and question-mark help together in the header', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 900 });
  await page.goto('/#/topics');
  await page.locator('.topic-card').filter({ hasText: 'Таблица единиц времени' }).click();

  const dialog = page.getByRole('dialog');
  const layout = await dialog.evaluate((node) => {
    const heading = node.querySelector('h2')!;
    const help = node.querySelector('.card-guide-toggle')!;
    const headingBox = heading.getBoundingClientRect();
    const helpBox = help.getBoundingClientRect();
    return {
      inline: heading.contains(help),
      headingBottom: headingBox.bottom,
      helpBottom: helpBox.bottom,
      fontSize: parseFloat(getComputedStyle(heading).fontSize),
      buttonText: help.textContent?.trim(),
    };
  });
  expect(layout.inline).toBe(true);
  expect(Math.abs(layout.headingBottom - layout.helpBottom)).toBeLessThan(3);
  expect(layout.fontSize).toBeLessThanOrEqual(21);
  expect(layout.buttonText).toBe('');
});

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
  await expect(dialog.getByText(/открыть её крупнее/)).toBeVisible();
  await help.click();
  const yearToggle = dialog.getByRole('button', { name: 'Показать пояснение: Год' });
  await yearToggle.click();
  const yearDetails = dialog.locator('#time-unit-detail-year');
  await expect(yearDetails).toBeVisible();
  await expect(yearDetails).toContainText('в нём 365 суток, а в високосном году — 366');
  await expect(yearDetails.locator('.time-units-detail img')).toHaveJSProperty(
    'naturalWidth',
    1254,
  );
  await dialog.getByRole('button', { name: 'Скрыть пояснение: Год' }).click();
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
