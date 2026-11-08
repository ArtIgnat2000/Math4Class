import { expect, test, type Locator, type Page } from '@playwright/test';
import { STORAGE_KEY } from '../../src/state/storage';

// The finger-drag test needs a phone-sized touch context. It gets one from the
// fixtures instead of creating a second browser context inside the test: in the
// long CI run the extra context occasionally could not be created at all
// ("Browser.setDownloadBehavior: Failed to find browser context"), which looked
// like a broken drag. One context per test keeps the run stable.
test.use({
  viewport: { width: 320, height: 568 },
  isMobile: true,
  hasTouch: true,
  reducedMotion: 'reduce',
});

async function openGame(page: Page) {
  await page.goto('/#/topics');
  await page.locator('.topic-card').filter({ hasText: 'Переводим годы в месяцы' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Играть — игра «Собери год»' }).click();
  await expect(dialog.getByRole('heading', { name: 'Собери год' })).toHaveCount(1);
  await expect(dialog.locator('.year-game h3')).toHaveClass(/sr-only/);
  // The variable font arrives after the first paint; a late swap re-wraps the
  // month tray and moves the chip away from the point the finger was aimed at.
  await page.evaluate(() => document.fonts.ready);
  return dialog;
}

/** The centre of an element, measured right before the event is dispatched. */
async function centreOf(locator: Locator): Promise<{ x: number; y: number }> {
  return locator.evaluate((element) => {
    const box = element.getBoundingClientRect();
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  });
}

/**
 * Waits until the scrollable dialog stops changing its geometry: the tray can
 * gain a row while images and fonts settle, and a measurement taken mid-change
 * sends the synthetic touch to empty space.
 */
async function settleScroll(page: Page) {
  const read = () =>
    page.evaluate(() => {
      const area = document.querySelector('.modal')!;
      return `${area.scrollTop}:${area.scrollHeight}:${area.clientHeight}`;
    });
  let previous = await read();
  await expect
    .poll(
      async () => {
        const current = await read();
        const stable = current === previous;
        previous = current;
        return stable;
      },
      { timeout: 5000, intervals: [50, 50, 100, 150] },
    )
    .toBe(true);
}

test('a finger drags a month to the circle even when the box starts below the fold', async ({
  page,
  context,
}) => {
  // Touch dispatch through CDP is slower than a normal click; keep the stricter
  // assertions but give a loaded CI runner room within the documented limits.
  test.slow();
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
  await settleScroll(page);

  const chip = dialog.getByRole('button', { name: 'Май', exact: true });
  const start = await centreOf(chip);
  await touch('touchStart', start.x, start.y);
  await touch('touchMove', start.x, start.y - 20);
  await expect(dialog.locator('.year-game-ghost')).toBeVisible();
  const top = await page.evaluate(
    () => document.querySelector('.modal')!.getBoundingClientRect().top,
  );
  await touch('touchMove', start.x, top + 18);
  // Holding the month at the edge must scroll the circle back into reach.
  // Wait for the scroll to settle before measuring the drop target.
  await expect.poll(() => page.evaluate(() => document.querySelector('.modal')!.scrollTop)).toBe(0);
  await expect(dialog.locator('[data-year-slot="4"]')).toBeInViewport();
  const place = await centreOf(dialog.locator('[data-year-slot="4"]'));
  await touch('touchMove', place.x, place.y);
  await touch('touchEnd', 0, 0);
  await expect(dialog.getByRole('status')).toContainText('Май — 5-й. Верно!');
  await expect(dialog.locator('[data-year-slot="4"]')).toHaveAccessibleName('Место 5: Май');
  await expect(dialog.locator('.year-game-chip')).toHaveCount(11);
  await expect(dialog.locator('.year-game-ghost')).toHaveCount(0);
  expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBeNull();
});
