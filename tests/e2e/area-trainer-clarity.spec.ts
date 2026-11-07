import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { STORAGE_KEY } from '../../src/state/storage';

for (const [width, height] of [
  [320, 568],
  [390, 844],
  [768, 1024],
  [820, 1180],
] as const) {
  test(`area games show the goal and keep the next action usable at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/#/topics');
    await page.locator('.topic-card').filter({ hasText: 'Площадь равных частей' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: /игра «Найди часть»/ }).click();
    const game = dialog.locator('.area-game');
    await expect(game.getByRole('button', { name: 'Справка' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    await expect(game.getByText('Найди площадь выделенного треугольника.')).toBeVisible();
    await expect(game.getByText(/Квадрат разделён на 4 равные части/)).toBeVisible();
    await expect(game.getByText('Весь квадрат: 36 см²')).toBeVisible();
    await expect(game.getByRole('img')).toHaveAccessibleName(/Выделены: верхняя/);
    await expect(game.getByRole('group', { name: 'Выбери площадь одной части' })).toBeVisible();
    if (width === 320) {
      const modal = (await dialog.boundingBox())!;
      for (const node of [
        game.locator('.area-game-goal'),
        game.locator('.trainer-instruction'),
        game.locator('.area-diagram'),
        game.locator('.equation-choices'),
      ]) {
        const box = (await node.boundingBox())!;
        expect(box.y).toBeGreaterThanOrEqual(modal.y);
        expect(box.y + box.height).toBeLessThanOrEqual(modal.y + modal.height);
      }
    }
    expect((await new AxeBuilder({ page }).include('.modal').analyze()).violations).toEqual([]);
    await game.getByRole('button', { name: '8 см²' }).click();
    await expect(game.getByRole('status')).toContainText('Раздели 36 см² на 4');
    await game.getByRole('button', { name: '9 см²' }).click();
    await expect(game.getByRole('status')).toContainText('36 : 4 = 9 см² — площадь части.');
    if (width === 320) {
      const modal = (await dialog.boundingBox())!;
      const next = (await game.getByRole('button', { name: 'Дальше' }).boundingBox())!;
      expect(next.x).toBeGreaterThanOrEqual(modal.x);
      expect(next.x + next.width).toBeLessThanOrEqual(modal.x + modal.width);
      expect(next.y + next.height).toBeLessThanOrEqual(modal.y + modal.height);
    }
    await game.getByRole('button', { name: 'Подсказка' }).click();
    await expect(game.getByRole('status')).toContainText('Нажми «Дальше»');
    await game.getByRole('button', { name: 'Дальше' }).click();
    await expect(game.getByText('Весь квадрат: 100 см²')).toBeVisible();
    await expect(game.getByText(/Квадрат разделён на 4 равные части/)).toBeVisible();
    await game.getByRole('button', { name: '25 см²' }).click();
    await expect(game.getByRole('button', { name: 'Ещё раз' })).toBeVisible();
    await game.getByRole('button', { name: 'К объяснению' }).click();
    await dialog.getByRole('button', { name: /игра «Собери половину»/ }).click();
    await expect(game.getByText('Собери половину квадрата.')).toBeVisible();
    await expect(game.getByText(/Нажми названия двух частей/)).toBeVisible();
    await game.getByRole('button', { name: 'Верхняя' }).click();
    await expect(game.getByRole('status')).toContainText('Выбрано: 1 из 4.');
    await game.getByRole('button', { name: 'Готово' }).click();
    await expect(game.getByRole('status')).toContainText('две части');
    await game.getByRole('button', { name: 'Левая' }).click();
    await expect(game.getByRole('img')).toHaveAccessibleName(/верхняя, левая/);
    await game.getByRole('button', { name: 'Готово' }).click();
    await expect(game.getByRole('status')).toContainText('9 + 9 = 18');
    await game.getByRole('button', { name: 'Дальше' }).click();
    await expect(game.getByRole('status')).toContainText('Выбрано: 0 из 4.');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
    expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBeNull();
  });
}

test('area games are operable with keyboard and can be corrected after a solution', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#/topics');
  await page.locator('.topic-card').filter({ hasText: 'Площадь равных частей' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: /игра «Собери половину»/ }).focus();
  await page.keyboard.press('Enter');
  const game = dialog.locator('.area-game');
  for (const name of ['Верхняя', 'Левая', 'Готово']) {
    await game.getByRole('button', { name }).focus();
    await page.keyboard.press('Enter');
  }
  await expect(game.getByRole('button', { name: 'Дальше' })).toBeVisible();
  await game.getByRole('button', { name: 'Левая' }).focus();
  await page.keyboard.press('Enter');
  await expect(game.getByText(/Нажми названия двух частей/)).toBeVisible();
  await expect(game.getByRole('status')).toContainText('Выбрано: 1 из 4.');
  await expect(game.getByRole('button', { name: 'Дальше' })).toHaveCount(0);
});
