import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

test('touch keypad enters and deletes a numeric answer without opening the OS keyboard', async ({
  page,
}) => {
  await page.goto('/#/topics');
  await page.locator('.topic-card').filter({ hasText: 'Килограмм и грамм' }).click();
  await page.getByRole('button', { name: 'Начать занятие' }).click();
  const answer = page.getByRole('textbox', { name: 'Твой ответ' });
  const keypad = page.getByRole('group', { name: 'Цифровая клавиатура' });
  await expect(keypad).toBeVisible();
  await expect(answer).toHaveAttribute('inputmode', 'none');
  for (const digit of ['3', '0', '0', '0'])
    await keypad.getByRole('button', { name: `Ввести ${digit}` }).click();
  await expect(answer).toHaveValue('3000');
  await keypad.getByRole('button', { name: 'Удалить цифру' }).click();
  await expect(answer).toHaveValue('300');
  await keypad.getByRole('button', { name: 'Ввести 0' }).click();
  await page.getByRole('button', { name: 'Проверить' }).click();
  await expect(keypad.getByRole('button', { name: 'Ввести 0' })).toBeDisabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('the keypad targets the selected quotient or remainder field', async ({ page }) => {
  await page.goto('/#/topics');
  await page
    .locator('.topic-card')
    .filter({ hasText: 'Вводим неполное частное и остаток отдельно' })
    .click();
  await page.getByRole('button', { name: 'Давай попробуем' }).click();
  const pad = page.getByRole('group', { name: 'Цифровая клавиатура' });
  await expect(pad).toBeVisible();
  await page.getByLabel('Неполное частное', { exact: true }).click();
  await pad.getByRole('button', { name: 'Ввести 3' }).click();
  await expect(page.getByLabel('Неполное частное', { exact: true })).toHaveValue('3');
  await page.getByLabel('Остаток', { exact: true }).click();
  await pad.getByRole('button', { name: 'Ввести 2' }).click();
  await expect(page.getByLabel('Остаток', { exact: true })).toHaveValue('2');
  await expect(page.getByLabel('Неполное частное', { exact: true })).toHaveValue('3');
  await expect(pad.getByRole('button', { name: 'Ввести запятую' })).toBeDisabled();
});
