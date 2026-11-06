import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';

const { version } = JSON.parse(
  await readFile(new URL('../../package.json', import.meta.url), 'utf8'),
);

test.use({ hasTouch: true, reducedMotion: 'reduce' });

test('purpose and help work on a small phone and portrait tablets', async ({ page }) => {
  for (const size of [
    { width: 320, height: 568 },
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 820, height: 1180 },
  ]) {
    await page.setViewportSize(size);
    await page.goto('/#/topics');
    await page.locator('.topic-card').filter({ hasText: 'Римские цифры' }).first().click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('Теория');
    const help = dialog.getByRole('button', { name: 'Справка' });
    expect((await help.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await help.focus();
    await page.keyboard.press('Enter');
    await expect(help).toHaveAttribute('aria-expanded', 'true');
    await expect(dialog.getByText(/Нажми знак и посмотри/)).toBeVisible();
    expect((await new AxeBuilder({ page }).include('.card-guide').analyze()).violations).toEqual(
      [],
    );
    await help.click();
    await dialog.getByRole('button', { name: 'Игра «Собери число»' }).click();
    await expect(dialog).toContainText('Тренажёр');
    await dialog.getByRole('button', { name: 'Справка' }).click();
    await expect(dialog.getByText(/Знаки можно переставлять и убирать/)).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      size.width,
    );
    await dialog.getByRole('button', { name: 'К объяснению' }).click();
    await dialog.getByRole('button', { name: 'Дальше' }).click();
    await dialog.getByRole('button', { name: 'Дальше' }).click();
    await dialog.getByRole('button', { name: 'Проверить себя' }).click();
    await expect(page.locator('.task-card')).toContainText('Практика');
    await page.getByRole('button', { name: 'Справка' }).click();
    await expect(page.getByText(/Выбери ответ и нажми/)).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      size.width,
    );
    await page.getByRole('button', { name: 'Сохранить и выйти' }).click();
  }
});

test('current version is visible in the mobile menu without scrolling', async ({ page }) => {
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 700 });
    await page.goto('/#/learn');
    await page.getByRole('button', { name: 'Открыть меню' }).click();
    const release = page.getByLabel(`Версия приложения ${version}`);
    await expect(release).toBeVisible();
    await expect(release).toBeInViewport({ ratio: 1 });
    await expect(release).toContainText(`v${version}`);
    await page.locator('.sidebar').getByRole('button', { name: 'Закрыть меню' }).click();
  }
});
