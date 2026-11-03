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
  await expect(keypad).toHaveCount(0);
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

test('iPad portrait keeps a tonne question, illustration, keypad and submit button on one screen', async ({
  page,
}) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto('/#/topics');
  await page.locator('.topic-card').filter({ hasText: 'Тонна, центнер, килограмм' }).click();
  await page.getByRole('button', { name: 'Начать занятие' }).click();
  // Pin the exact 3 t question from the reported screenshot; sessions normally shuffle.
  const { readFile } = await import('node:fs/promises');
  const pack = JSON.parse(
    await readFile(new URL('../../src/content/grade-4.json', import.meta.url), 'utf8'),
  );
  const task = pack.topics
    .find((topic: { id: string }) => topic.id === 'mass-tonne-centner')
    .tasks.find((task: { id: string }) => task.id === 'tonnes-3');
  await page.evaluate((task) => {
    const key = 'chislo:data:v1';
    const data = JSON.parse(localStorage.getItem(key)!);
    const profile = data.profiles.find((item: { id: string }) => item.id === data.activeProfileId);
    profile.activeSession.entries[0] = { task, retry: false };
    profile.activeSession.cursor = 0;
    localStorage.setItem(key, JSON.stringify(data));
  }, task);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Сколько килограммов в 3 т?' })).toBeVisible();
  await expect(page.locator('.centner-question-visual img')).toHaveCount(3);
  await expect(page.getByRole('group', { name: 'Цифровая клавиатура' })).toBeVisible();
  for (const size of [
    { width: 768, height: 1024 },
    { width: 820, height: 1180 },
  ]) {
    await page.setViewportSize(size);
    const positions = await page.evaluate(() => ({
      scrollHeight: document.documentElement.scrollHeight,
      viewportHeight: innerHeight,
      bottom: document.querySelector('.task-card')!.getBoundingClientRect().bottom,
      keypadKeyHeight: document.querySelector('.numeric-keypad button')!.getBoundingClientRect()
        .height,
    }));
    expect(
      positions.scrollHeight,
      `${size.width}×${size.height}: no vertical scroll`,
    ).toBeLessThanOrEqual(size.height);
    expect(
      positions.bottom,
      `${size.width}×${size.height}: leave room below the card`,
    ).toBeLessThan(size.height - 48);
    expect(positions.keypadKeyHeight).toBeGreaterThanOrEqual(44);
  }
});
