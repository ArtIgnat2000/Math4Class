import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function openPractice(page: Page, topic: string) {
  await page.goto('/#/topics');
  await page.locator('.topic-card').filter({ hasText: topic }).first().click();
  const dialog = page.getByRole('dialog');
  for (let step = 0; step < 6; step++) {
    const start = dialog.getByRole('button', { name: 'Проверить себя' });
    if (await start.isVisible()) {
      await start.click();
      await expect(page.locator('.task-card')).toBeVisible();
      return;
    }
    await dialog.getByRole('button', { name: 'Дальше' }).click();
  }
  throw new Error('Не удалось открыть практику');
}

test('разряды разделяются пробелами ещё до проверки ответа', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openPractice(page, 'Умножаем и делим на 10, 100, 1 000');
  const answer = page.getByLabel('Твой ответ');
  const pad = page.getByRole('group', { name: 'Цифровая клавиатура' });

  for (const digit of ['8', '6', '0', '0', '0', '0']) {
    await pad.getByRole('button', { name: `Ввести ${digit}`, exact: true }).click();
  }
  await expect(answer).toHaveValue('860 000');

  await pad.getByRole('button', { name: 'Удалить цифру' }).click();
  await expect(answer).toHaveValue('86 000');

  // Ждём, пока клавиатура вернёт курсор после последнего нажатия: так тест
  // не гоняется с её requestAnimationFrame.
  await expect
    .poll(() => answer.evaluate((field) => (field as HTMLInputElement).selectionStart))
    .toBe(6);

  // Правка в середине числа не сбрасывает курсор в конец.
  await answer.press('Home');
  await answer.press('ArrowRight');
  await answer.press('ArrowRight');
  await answer.press('9');
  await expect(answer).toHaveValue('869 000');
  expect(
    await answer.evaluate((field) => (field as HTMLInputElement).selectionStart),
  ).toBeGreaterThan(0);

  await expect(page.getByRole('button', { name: 'Проверить' })).toBeEnabled();
  expect((await new AxeBuilder({ page }).include('.task-card').analyze()).violations).toEqual([]);
});

test('семизначный ответ читается и на телефоне', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await openPractice(page, 'Умножаем и делим на 10, 100, 1 000');
  const answer = page.getByLabel('Твой ответ');
  const pad = page.getByRole('group', { name: 'Цифровая клавиатура' });
  for (const digit of ['1', '2', '3', '4', '5', '6', '7']) {
    await pad.getByRole('button', { name: `Ввести ${digit}`, exact: true }).click();
  }
  await expect(answer).toHaveValue('1 234 567');
  const box = await answer.boundingBox();
  expect(box!.width).toBeGreaterThanOrEqual(180);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await expect(page.getByRole('button', { name: 'Проверить' })).toBeInViewport();
  expect((await new AxeBuilder({ page }).include('.task-card').analyze()).violations).toEqual([]);
  await page.locator('.task-card').screenshot({ path: '/tmp/shots/grouping-320.png' });
});
