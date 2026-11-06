import { expect, test, type Locator, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { STORAGE_KEY } from '../../src/state/storage';

const MONTHS = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
];

async function openGame(page: Page) {
  await page.goto('/#/topics');
  await page.locator('.topic-card').filter({ hasText: 'Переводим годы в месяцы' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Играть — игра «Собери год»' }).click();
  await expect(dialog.getByRole('heading', { name: 'Собери год' })).toHaveCount(1);
  await expect(dialog.locator('.year-game h3')).toHaveClass(/sr-only/);
  return dialog;
}

async function dragWithMouse(page: Page, dialog: Locator, month: string, slot: number) {
  const chip = await dialog.getByRole('button', { name: month, exact: true }).boundingBox();
  const place = await dialog.locator(`[data-year-slot="${slot}"]`).boundingBox();
  expect(chip).not.toBeNull();
  expect(place).not.toBeNull();
  await page.mouse.move(chip!.x + chip!.width / 2, chip!.y + chip!.height / 2);
  await page.mouse.down();
  await page.mouse.move(chip!.x + chip!.width / 2 + 12, chip!.y + chip!.height / 2 - 12, {
    steps: 3,
  });
  await page.mouse.move(place!.x + place!.width / 2, place!.y + place!.height / 2, { steps: 8 });
  await page.mouse.up();
}

test('a mouse builds the whole year, and the game never scores or saves progress', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  const dialog = await openGame(page);
  await expect(dialog.locator('.year-game-progress')).toHaveCount(0);
  await expect(dialog.locator('.year-game-count')).toHaveCount(0);
  await expect(dialog.locator('.year-game-lead')).toHaveClass(/sr-only/);
  await expect(dialog.getByRole('status')).toContainText('Перетащи или нажми');
  await expect(dialog.locator('[data-year-slot]')).toHaveCount(12);
  await expect(dialog.locator('.year-game-chip')).toHaveCount(12);
  await expect(dialog.locator('.year-game-clock .year-sector.is-filled')).toHaveCount(0);
  await expect(dialog.getByText('Авторская игра')).toHaveCount(0);

  // A wrong place must not swallow the month.
  await dragWithMouse(page, dialog, 'Март', 0);
  await expect(dialog.getByRole('status')).toContainText('Март — не 1-й месяц');
  await expect(dialog.locator('.year-game-chip')).toHaveCount(12);
  await expect(dialog.locator('.year-game-clock .year-sector.is-filled')).toHaveCount(0);

  // Out of order on purpose: the sector for March alone must light up.
  await dragWithMouse(page, dialog, 'Март', 2);
  await expect(dialog.getByRole('status')).toContainText('Март — 3-й. Верно!');
  await expect(dialog.locator('.year-game-clock .year-sector.is-filled')).toHaveCount(1);
  await expect(dialog.locator('[data-year-slot="2"]')).toHaveAccessibleName('Место 3: Март');
  await expect(dialog.locator('.year-game-chip')).toHaveCount(11);

  let left = 11;
  for (let index = 0; index < 12; index += 1) {
    if (index === 2) continue;
    await dragWithMouse(page, dialog, MONTHS[index], index);
    left -= 1;
    await expect(dialog.locator('.year-game-chip')).toHaveCount(left);
  }
  await expect(dialog.locator('.year-game-clock .year-sector.is-filled')).toHaveCount(12);
  await expect(dialog.getByRole('status')).toContainText('Год собран!');
  await expect(dialog.locator('.year-clock-center strong')).toHaveText('12');
  await expect(dialog.locator('.year-game-chip')).toHaveCount(0);
  await expect(page.locator('.task-card')).toHaveCount(0);
  expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBeNull();

  await dialog.getByRole('button', { name: 'Ещё раз' }).click();
  await expect(dialog.locator('.year-game-chip')).toHaveCount(12);
  await expect(dialog.locator('.year-game-clock .year-sector.is-filled')).toHaveCount(0);
  await dialog.getByRole('button', { name: 'К объяснению' }).click();
  await expect(dialog.getByRole('group', { name: 'Круг года: 12 месяцев' })).toBeVisible();
  await expect(page.locator('.task-card')).toHaveCount(0);
});

test('a finger drags a month to the circle even when the box starts below the fold', async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 320, height: 568 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: 'reduce',
  });
  try {
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    const touch = (type: 'touchStart' | 'touchMove' | 'touchEnd', x: number, y: number) =>
      cdp.send('Input.dispatchTouchEvent', {
        type,
        touchPoints: type === 'touchEnd' ? [] : [{ x, y, radiusX: 12, radiusY: 12, force: 1 }],
      });

    const dialog = await openGame(page);
    // The child scrolls down to the box first, exactly as on a real phone.
    await page.evaluate(() => {
      const area = document.querySelector('.modal')!;
      area.scrollTop = area.scrollHeight;
    });
    const scrolledBefore = await page.evaluate(() => document.querySelector('.modal')!.scrollTop);
    expect(scrolledBefore).toBeGreaterThan(0);

    const chip = (await dialog.getByRole('button', { name: 'Май', exact: true }).boundingBox())!;
    await touch('touchStart', chip.x + chip.width / 2, chip.y + chip.height / 2);
    await touch('touchMove', chip.x + chip.width / 2, chip.y + chip.height / 2 - 20);
    await expect(dialog.locator('.year-game-ghost')).toBeVisible();
    const top = await page.evaluate(
      () => document.querySelector('.modal')!.getBoundingClientRect().top,
    );
    await touch('touchMove', chip.x + chip.width / 2, top + 18);
    // Holding the month at the edge must scroll the circle back into reach.
    // Wait for the scroll to settle before measuring the drop target.
    await expect
      .poll(() => page.evaluate(() => document.querySelector('.modal')!.scrollTop))
      .toBe(0);
    await expect(dialog.locator('[data-year-slot="4"]')).toBeInViewport();
    const place = (await dialog.locator('[data-year-slot="4"]').boundingBox())!;
    await touch('touchMove', place.x + place.width / 2, place.y + place.height / 2);
    await touch('touchEnd', 0, 0);
    await expect(dialog.getByRole('status')).toContainText('Май — 5-й. Верно!');
    await expect(dialog.locator('[data-year-slot="4"]')).toHaveAccessibleName('Место 5: Май');
    await expect(dialog.locator('.year-game-chip')).toHaveCount(11);
    await expect(dialog.locator('.year-game-ghost')).toHaveCount(0);
    expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBeNull();
  } finally {
    await context.close();
  }
});

for (const [width, height] of [
  [320, 568],
  [390, 844],
  [768, 1024],
  [820, 1180],
] as const) {
  test(`the game is tappable, readable and accessible at ${width}px`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width, height },
      isMobile: true,
      hasTouch: true,
      reducedMotion: 'reduce',
    });
    try {
      const page = await context.newPage();
      const dialog = await openGame(page);

      const geometry = await page.evaluate(() => {
        const tray = document.querySelector('.year-game-tray')!.getBoundingClientRect();
        const chips = [...document.querySelectorAll('.year-game-chip')].map((node) =>
          node.getBoundingClientRect(),
        );
        const places = [...document.querySelectorAll('[data-year-slot]')].map((node) =>
          node.getBoundingClientRect(),
        );
        const tools = document.querySelector('.year-game-tools')!.getBoundingClientRect();
        const modal = document.querySelector('.modal')!.getBoundingClientRect();
        return {
          pageWidth: document.documentElement.scrollWidth,
          chipHeights: chips.map((box) => box.height),
          placeSizes: places.map((box) => Math.min(box.width, box.height)),
          escapedChips: chips.filter(
            (box) => box.right > tray.right + 1 || box.left < tray.left - 1,
          ).length,
          toolsInside: tools.right <= modal.right + 1,
        };
      });
      expect(geometry.pageWidth).toBeLessThanOrEqual(width);
      expect(geometry.escapedChips, `month names must stay inside the box at ${width}px`).toBe(0);
      expect(geometry.toolsInside).toBe(true);
      for (const value of geometry.chipHeights) expect(value).toBeGreaterThanOrEqual(44);
      for (const value of geometry.placeSizes) expect(value).toBeGreaterThanOrEqual(44);

      // Tap-to-place is the fallback for children who cannot drag.
      await dialog.getByRole('button', { name: 'Сентябрь', exact: true }).tap();
      await expect(dialog.getByRole('button', { name: 'Сентябрь', exact: true })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      await dialog.getByRole('button', { name: 'Подсказка' }).tap();
      await expect(dialog.locator('[data-year-slot="8"]')).toHaveClass(/is-hint/);
      await dialog.locator('[data-year-slot="8"]').tap();
      await expect(dialog.getByRole('status')).toContainText('Сентябрь — 9-й. Верно!');
      await expect(dialog.locator('.year-game-clock .year-sector.is-filled')).toHaveCount(1);
      await expect(dialog.locator('.year-game-chip')).toHaveCount(11);

      const violations = (
        await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
          .analyze()
      ).violations.map((item) => ({ id: item.id, targets: item.nodes.map((node) => node.target) }));
      expect(violations, `axe violations at ${width}px`).toEqual([]);
      expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBeNull();
    } finally {
      await context.close();
    }
  });
}
