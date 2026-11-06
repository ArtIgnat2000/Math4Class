import { expect, test } from '@playwright/test';

const STORAGE_KEY = 'chislo:data:v1';
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

const openLesson = async (page: import('@playwright/test').Page) => {
  await page.goto('/#/topics');
  await page.locator('.topic-card').filter({ hasText: 'Римские цифры' }).first().click();
  return page.getByRole('dialog');
};

test('the roman lesson teaches interactively and only then opens the approved check', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const dialog = await openLesson(page);
  await expect(dialog.getByText('Авторское объяснение')).toHaveCount(0);
  await expect(page.locator('.task-card')).toHaveCount(0);

  // Step 1: a sign opens the sticks it replaces.
  await dialog.getByRole('button', { name: 'X 10 — знак X, это 10' }).click();
  await expect(dialog.locator('.roman-stick-bundle')).toHaveCount(2);
  await expect(dialog.locator('.roman-stick-bundle i')).toHaveCount(10);

  // Step 2: the record is built by the child and finished with its value.
  await dialog.getByRole('button', { name: 'Дальше' }).click();
  await expect(dialog.locator('.pilot-steps')).toHaveAttribute('aria-label', 'Шаг 2 из 3');
  await dialog.getByRole('button', { name: 'Добавить V' }).click();
  await dialog.getByRole('button', { name: 'Добавить I' }).click();
  await expect(dialog.locator('.pilot-formula-result')).toHaveText('XVI = 16');

  // Step 3: both positions of I, and the second decade agreed with the owner.
  await dialog.getByRole('button', { name: 'Дальше' }).click();
  await expect(dialog.locator('.pilot-formula-result')).toHaveText('IV = 4');
  await dialog.getByRole('button', { name: 'I справа' }).click();
  await expect(dialog.locator('.pilot-formula-result')).toHaveText('VI = 6');
  await dialog.getByRole('button', { name: 'Добавить десяток впереди' }).click();
  await expect(dialog.locator('.pilot-formula-result')).toHaveText('XVI = 16');

  // Model tools and navigation differ in colour and are separated (CONTROLS-01).
  const tools = (await dialog.locator('.pilot-model-controls').boundingBox())!;
  const nav = (await dialog.locator('.pilot-actions').boundingBox())!;
  expect(nav.y).toBeGreaterThan(tools.y + tools.height);
  const toolColor = await dialog
    .locator('.pilot-model-controls .tool-add')
    .first()
    .evaluate((node) => getComputedStyle(node).backgroundColor);
  const navColor = await dialog
    .locator('.pilot-actions .button.primary')
    .evaluate((node) => getComputedStyle(node).backgroundColor);
  expect(toolColor).not.toBe(navColor);

  // The approved exercises ask for a month, so no month name may appear anywhere.
  const text = (await dialog.textContent()) ?? '';
  for (const month of MONTHS) expect(text, `leaked ${month}`).not.toContain(month);
  expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBeNull();

  await dialog.getByRole('button', { name: 'Проверить себя' }).click();
  await expect(page.locator('.task-card')).toBeVisible();
  await expect(page.getByRole('heading', { name: /Какой месяц обозначен/ })).toBeVisible();
  // Explanation stays reachable from the task and keeps the session (HELP-01).
  await page.getByRole('button', { name: 'Объяснение' }).click();
  const reference = page.getByRole('dialog');
  await expect(reference.locator('.roman-pilot')).toBeVisible();
  await reference.getByRole('button', { name: 'К заданию' }).click();
  await expect(page.locator('.task-card')).toBeVisible();
});

test.describe('a touch device', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test('a finger picks a clock sector with no hand over the number and no scoring', async ({
    page,
  }) => {
    const cdp = await page.context().newCDPSession(page);
    const touch = (type: 'touchStart' | 'touchMove' | 'touchEnd', x: number, y: number) =>
      cdp.send('Input.dispatchTouchEvent', {
        type,
        touchPoints: type === 'touchEnd' ? [] : [{ x, y, radiusX: 12, radiusY: 12, force: 1 }],
      });
    const dialog = await openLesson(page);
    await dialog.getByRole('button', { name: 'Игра «Римские часы»' }).click();
    const target = Number(await dialog.locator('.roman-dial-center strong').textContent());
    const sector = dialog.locator(`[data-roman-sector="${target - 1}"]`);
    await expect(sector).toBeInViewport();
    const dial = (await dialog.locator('.roman-dial').boundingBox())!;
    const place = (await sector.boundingBox())!;
    // Start in the ring, then drag onto the asked sector; no hand is drawn (MODEL-04).
    await touch('touchStart', dial.x + dial.width / 2, dial.y + 12);
    await touch('touchMove', place.x + place.width / 2, place.y + place.height / 2);
    await touch('touchEnd', 0, 0);
    await expect(dialog.getByRole('status')).toContainText('Верно!');
    await expect(dialog.locator('.year-sector.is-filled')).toHaveCount(1);
    await expect(dialog.locator('.roman-dial-svg line')).toHaveCount(0);
    await expect(dialog.locator('.roman-dial-center strong')).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Проверить себя' })).toHaveCount(0);
    expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBeNull();
    await cdp.detach();
  });
});

test('the constructor refuses a broken record with the rule that was broken', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const dialog = await openLesson(page);
  await dialog.getByRole('button', { name: 'Игра «Собери число»' }).click();
  const ones = dialog.getByRole('button', { name: 'Добавить I' });
  for (let i = 0; i < 3; i += 1) await ones.click();
  await expect(dialog.getByRole('status')).toContainText('III — это 3. Верно!');
  await dialog.getByRole('button', { name: 'Дальше' }).click();
  for (let i = 0; i < 4; i += 1) await ones.click();
  await expect(dialog.getByRole('status')).toContainText('Четыре I подряд не пишут');
  await expect(dialog.locator('.roman-build-value')).toHaveText('= 3');
  expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBeNull();
});

for (const [width, height] of [
  [320, 568],
  [390, 844],
  [768, 1024],
  [820, 1180],
] as const) {
  test(`the roman lesson stays operable at ${width}px without motion`, async ({ page }) => {
    // Reuse the fixture page: extra browser contexts exhaust the sandbox Chromium.
    await page.setViewportSize({ width, height });
    {
      const dialog = await openLesson(page);
      for (const step of [1, 2, 3]) {
        const header = await dialog.evaluate((node) => {
          const title = node.querySelector('h2')!;
          const style = getComputedStyle(title);
          const leftover = Array.from(
            node.querySelectorAll<HTMLElement>(
              '.pilot-topline, .roman-pilot > h3, .pilot-instruction',
            ),
          ).filter((item) => !item.classList.contains('sr-only') && item.textContent?.trim());
          return {
            lines: Math.round(title.getBoundingClientRect().height / parseFloat(style.lineHeight)),
            leftover: leftover.map((item) => item.textContent?.trim()),
          };
        });
        expect(header.lines, `header lines at ${width}px, step ${step}`).toBe(1);
        expect(header.leftover, `extra header text at ${width}px`).toEqual([]);
        const next = dialog.getByRole('button', { name: step < 3 ? 'Дальше' : 'Проверить себя' });
        await expect(next).toBeInViewport();
        expect((await next.boundingBox())!.height).toBeGreaterThanOrEqual(44);
        if (step < 3) await next.click();
      }
      await dialog.getByRole('button', { name: 'Игра «Римские часы»' }).click();
      const hit = (await dialog.locator('[data-roman-sector="0"]').boundingBox())!;
      expect(hit.width).toBeGreaterThanOrEqual(44);
      expect(hit.height).toBeGreaterThanOrEqual(44);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      );
    }
  });
}

test.describe('the constructor by hand', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test('a finger drags a sign in, reorders it and takes it back out', async ({ page }) => {
    const cdp = await page.context().newCDPSession(page);
    const touch = (type: 'touchStart' | 'touchMove' | 'touchEnd', x: number, y: number) =>
      cdp.send('Input.dispatchTouchEvent', {
        type,
        touchPoints: type === 'touchEnd' ? [] : [{ x, y, radiusX: 12, radiusY: 12, force: 1 }],
      });
    const centre = (box: { x: number; y: number; width: number; height: number }) => ({
      x: box.x + box.width / 2,
      y: box.y + box.height / 2,
    });

    const dialog = await openLesson(page);
    await dialog.getByRole('button', { name: 'Игра «Собери число»' }).click();
    const drop = dialog.locator('.roman-build-drop');
    const board = (await drop.boundingBox())!;

    // 1. Carry V from the tray onto the board with a finger.
    const v = centre((await dialog.getByRole('button', { name: 'Добавить V' }).boundingBox())!);
    await touch('touchStart', v.x, v.y);
    await touch('touchMove', board.x + board.width / 2, board.y + board.height / 2);
    await expect(dialog.locator('.roman-build-ghost')).toBeVisible();
    await touch('touchEnd', 0, 0);
    await expect(dialog.locator('[data-build-index]')).toHaveCount(1);
    await expect(dialog.locator('.roman-build-value')).toHaveText('= 5');

    // 2. Carry I to the right end: VI is 6.
    const i = centre((await dialog.getByRole('button', { name: 'Добавить I' }).boundingBox())!);
    await touch('touchStart', i.x, i.y);
    await touch('touchMove', board.x + board.width - 6, board.y + board.height / 2);
    await touch('touchEnd', 0, 0);
    await expect(dialog.locator('[data-build-index]')).toHaveCount(2);
    await expect(dialog.locator('.roman-build-value')).toHaveText('= 6');

    // 3. Drag the placed I to the left of V: the position changes the number to 4.
    const placed = (await dialog.locator('[data-build-index="1"]').boundingBox())!;
    const from = centre(placed);
    await touch('touchStart', from.x, from.y);
    await touch('touchMove', board.x + 4, board.y + board.height / 2);
    await expect(dialog.locator('.roman-build-caret')).toBeVisible();
    await touch('touchEnd', 0, 0);
    await expect(dialog.locator('.roman-build-value')).toHaveText('= 4');
    await expect(dialog.getByRole('status')).toContainText('IV — это 4.');

    // 4. Drag that I off the board: it goes back, V remains.
    const moved = (await dialog.locator('[data-build-index="0"]').boundingBox())!;
    const start = centre(moved);
    await touch('touchStart', start.x, start.y);
    await touch('touchMove', start.x, board.y + board.height + 130);
    await touch('touchEnd', 0, 0);
    await expect(dialog.locator('[data-build-index]')).toHaveCount(1);
    await expect(dialog.locator('.roman-build-value')).toHaveText('= 5');
    await expect(dialog.getByRole('status')).toContainText('Знак I убран.');

    // Nothing was scored, saved or turned into a checked session.
    await expect(dialog.getByRole('button', { name: 'Проверить себя' })).toHaveCount(0);
    expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBeNull();
    await cdp.detach();
  });

  test('a mouse drags a sign into the middle of the record', async ({ page }) => {
    const dialog = await openLesson(page);
    await dialog.getByRole('button', { name: 'Игра «Собери число»' }).click();
    await dialog.getByRole('button', { name: 'Добавить V' }).click();
    await dialog.getByRole('button', { name: 'Добавить I' }).click();
    await expect(dialog.locator('.roman-build-value')).toHaveText('= 6');

    const board = (await dialog.locator('.roman-build-drop').boundingBox())!;
    const chip = (await dialog.locator('[data-build-index="1"]').boundingBox())!;
    await page.mouse.move(chip.x + chip.width / 2, chip.y + chip.height / 2);
    await page.mouse.down();
    await page.mouse.move(board.x + 4, board.y + board.height / 2, { steps: 8 });
    await expect(dialog.locator('.roman-build-ghost')).toBeVisible();
    await page.mouse.up();
    await expect(dialog.locator('.roman-build-value')).toHaveText('= 4');
    expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBeNull();
  });
});
