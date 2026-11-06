import { expect, test } from '@playwright/test';

const openTopic = async (page: import('@playwright/test').Page, title: string) => {
  await page.goto('/#/topics');
  await page.locator('.topic-card').filter({ hasText: title }).first().click();
  return page.getByRole('dialog');
};

test('the numeric keypad is on screen for a mouse too, and still fits an iPad', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const dialog = await openTopic(page, 'Уравнения: сложение и вычитание');
  await expect(dialog.getByText('4 класс')).toHaveCount(0);
  await dialog.getByRole('button', { name: 'Давай попробуем' }).click();
  await expect(page.locator('.task-card')).toBeVisible();

  const pad = page.getByRole('group', { name: 'Цифровая клавиатура' });
  await expect(pad).toBeVisible();
  const answer = page.getByLabel('Твой ответ');
  await pad.getByRole('button', { name: 'Ввести 2', exact: true }).click();
  await pad.getByRole('button', { name: 'Ввести 7', exact: true }).click();
  await pad.getByRole('button', { name: 'Ввести 0', exact: true }).click();
  await expect(answer).toHaveValue('270');
  await pad.getByRole('button', { name: 'Удалить цифру' }).click();
  await expect(answer).toHaveValue('27');
  // A physical keyboard keeps working next to the on-screen keys.
  await answer.press('End');
  await answer.press('0');
  await expect(answer).toHaveValue('270');

  for (const size of [
    { width: 768, height: 1024 },
    { width: 820, height: 1180 },
  ]) {
    await page.setViewportSize(size);
    const box = await page.evaluate(() => ({
      scrollHeight: document.documentElement.scrollHeight,
      bottom: document.querySelector('.task-card')!.getBoundingClientRect().bottom,
      keyHeight: document.querySelector('.numeric-keypad button')!.getBoundingClientRect().height,
    }));
    expect(
      box.scrollHeight,
      `${size.width}×${size.height}: no vertical scroll`,
    ).toBeLessThanOrEqual(size.height);
    expect(box.bottom, `${size.width}×${size.height}: room below the card`).toBeLessThan(
      size.height - 48,
    );
    expect(box.keyHeight).toBeGreaterThanOrEqual(44);
  }
});

test('a task card can reopen the explanation without losing the answer or leaking it', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const dialog = await openTopic(page, 'Переводим годы в месяцы');
  await dialog.getByRole('button', { name: 'Дальше' }).click();
  await dialog.getByRole('button', { name: 'Дальше' }).click();
  await dialog.getByRole('button', { name: 'Проверить себя' }).click();
  await expect(page.locator('.task-card')).toBeVisible();
  await expect(page.locator('.lesson-shell').getByText('4 класс')).toHaveCount(0);

  // The title and exit form the first row; the counter and help share the second.
  const header = await page.locator('.task-card').evaluate((node) => {
    const title = node.querySelector('.task-card-title')!.getBoundingClientRect();
    const exit = node.querySelector('.task-exit')!.getBoundingClientRect();
    const progress = node.querySelector('.pilot-steps')!.getBoundingClientRect();
    const help = node.querySelector('.card-guide-toggle')!.getBoundingClientRect();
    return { title, exit, progress, help };
  });
  expect(Math.abs(header.title.y - header.exit.y)).toBeLessThan(20);
  expect(Math.abs(header.progress.y - header.help.y)).toBeLessThan(10);
  expect(header.progress.y).toBeGreaterThan(header.title.y);

  await page
    .getByRole('group', { name: 'Цифровая клавиатура' })
    .getByRole('button', {
      name: 'Ввести 4',
      exact: true,
    })
    .click();
  await page.getByRole('button', { name: 'Объяснение' }).click();
  const reference = page.getByRole('dialog');
  await expect(reference.getByRole('group', { name: 'Инструменты модели' })).toBeVisible();
  await expect(reference.getByText(/Авторское объяснение/)).toHaveCount(0);
  await expect(reference.getByText('48 месяцев')).toHaveCount(0);
  await expect(reference.getByText('27 месяцев')).toHaveCount(0);
  await reference.getByRole('button', { name: 'К заданию' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByLabel('Твой ответ')).toHaveValue('4');

  const stored = await page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem('chislo:data:v1')!);
    const profile = data.profiles.find((item: { id: string }) => item.id === data.activeProfileId);
    return { cursor: profile.activeSession.cursor, hintOpen: profile.activeSession.hintOpen };
  });
  expect(stored.cursor).toBe(0);
  expect(stored.hintOpen).toBe(true);
});
