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

test('game titles fit their buttons on phones and remain usable at every step', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const [width, height] of [
    [320, 568],
    [375, 812],
    [390, 844],
    [430, 932],
    [480, 800],
    [520, 800],
    [521, 800],
    [580, 818],
    [581, 818],
    [585, 818],
    [620, 900],
    [621, 900],
    [768, 1024],
    [820, 1180],
    [1200, 900],
  ] as const) {
    await page.setViewportSize({ width, height });
    await page.goto('/#/topics');
    await page.locator('.topic-card').filter({ hasText: 'Как называют время словами' }).click();
    const dialog = page.getByRole('dialog');
    const games = dialog.getByRole('group', { name: 'Игры' });
    for (let step = 0; step < 3; step++) {
      const buttons = games.getByRole('button');
      await expect(buttons).toHaveCount(4);
      for (const button of await buttons.all()) {
        const box = (await button.boundingBox())!;
        const label = (await button.locator('span').boundingBox())!;
        const icon = (await button.locator('svg').boundingBox())!;
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
        for (const child of [label, icon]) {
          expect(child.x).toBeGreaterThanOrEqual(box.x);
          expect(child.x + child.width).toBeLessThanOrEqual(box.x + box.width);
          expect(child.y).toBeGreaterThanOrEqual(box.y);
          expect(child.y + child.height).toBeLessThanOrEqual(box.y + box.height);
        }
        expect(
          await button.locator('span').evaluate((el) => el.scrollWidth <= el.clientWidth),
        ).toBe(true);
      }
      if (width <= 620) {
        const rows = await buttons.evaluateAll((elements) =>
          elements.map((el) => (el as HTMLElement).offsetTop),
        );
        expect(rows[0]).toBe(rows[1]);
        expect(rows[2]).toBe(rows[3]);
        expect(rows[2]).toBeGreaterThan(rows[0]);
      }
      if (step < 2) await dialog.getByRole('button', { name: 'Дальше' }).click();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
    expect((await new AxeBuilder({ page }).include('.modal').analyze()).violations).toEqual([]);
    await dialog.getByRole('button', { name: 'Закрыть окно' }).click();
  }
});
