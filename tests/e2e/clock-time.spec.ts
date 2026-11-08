import { expect, test } from '@playwright/test';

const STORAGE_KEY = 'chislo:data:v1';

/** Exact wordings of the checked exercises: they must never appear in the lesson. */
const CHECKED_PHRASES = [
  'половина шестого',
  'без четверти восемь',
  'без пяти шесть',
  'без двадцати восемь',
  'двадцать минут девятого',
  'четверть седьмого',
  'без четверти семь',
];

const openLesson = async (page: import('@playwright/test').Page) => {
  await page.goto('/#/topics');
  await page.locator('.topic-card').filter({ hasText: 'Время на часах' }).first().click();
  return page.getByRole('dialog');
};

test('the clock lesson explains, plays and only then opens the approved check', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const dialog = await openLesson(page);

  // Step 1: the hour and the minute are changed separately, the arcs answer immediately.
  await expect(dialog.locator('.clock-dial svg')).toBeVisible();
  await expect(dialog.locator('.clock-progress')).toContainText('прошло');
  const before = await dialog.locator('.clock-readout span').textContent();
  await dialog.getByRole('button', { name: 'Другая минута' }).click();
  await expect(dialog.locator('.clock-readout span')).not.toHaveText(before!);

  // Step 2: choosing a half or a quarter moves the hand and changes the words.
  await dialog.getByRole('button', { name: 'Дальше' }).click();
  await expect(dialog.locator('.pilot-steps')).toHaveAttribute('aria-label', 'Шаг 2 из 3');
  await dialog.getByRole('button', { name: /Без четверти/ }).click();
  await expect(dialog.locator('.clock-readout strong')).toContainText('без четверти');

  // Step 3: minutes walk towards the whole hour and the rest is counted.
  await dialog.getByRole('button', { name: 'Дальше' }).click();
  for (let i = 0; i < 6; i += 1)
    await dialog.getByRole('button', { name: '+5 мин: добавить пять минут' }).click();
  await expect(dialog.getByRole('status')).toContainText('не хватает 25 мин');

  // Every game opens from a step, gives causal feedback and returns to the same step.
  await dialog.getByRole('button', { name: 'Игра «Назови время»' }).click();
  const buttons = dialog.locator('.clock-choice');
  await expect(buttons).toHaveCount(4);
  const label = (await dialog.locator('.clock-dial svg').getAttribute('aria-label')) ?? '';
  expect(label).toContain('Часы показывают');
  const phrase = label.split(': ')[1].split('.')[0];
  await dialog.getByRole('button', { name: phrase, exact: true }).click();
  await expect(dialog.getByRole('status')).toContainText('Верно!');
  await dialog.getByRole('button', { name: 'К объяснению' }).click();
  await expect(dialog.locator('.pilot-steps')).toHaveAttribute('aria-label', 'Шаг 3 из 3');

  await dialog.getByRole('button', { name: 'Игра «Поставь стрелки»' }).click();
  await expect(dialog.locator('[data-clock-minute]')).toHaveCount(12);
  await expect(dialog.locator('.clock-target strong')).not.toHaveText('');
  await dialog.locator('[data-clock-minute="20"]').click();
  await dialog.getByRole('button', { name: 'Проверить' }).click();
  await expect(dialog.getByRole('status')).not.toHaveText('');
  await dialog.getByRole('button', { name: 'К объяснению' }).click();

  await dialog.getByRole('button', { name: 'Игра «Собери фразу»' }).click();
  await expect(dialog.locator('.clock-chip').first()).toBeVisible();
  await dialog.getByRole('button', { name: 'К объяснению' }).click();

  // Nothing is scored, timed or written while the child explores.
  await expect(dialog.getByRole('button', { name: 'Проверить себя' })).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBeNull();

  await dialog.getByRole('button', { name: 'Проверить себя' }).click();
  await expect(page.locator('.task-card')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: /половина шестого|7:45|5:55|7:40|8:20|раньше/ }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Объяснение' }).click();
  const reference = page.getByRole('dialog');
  await expect(reference.locator('.clock-pilot')).toBeVisible();
  await reference.getByRole('button', { name: 'К заданию' }).click();
  await expect(page.locator('.task-card')).toBeVisible();
});

test('no checked wording is printed by the explanation or by a game round', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const dialog = await openLesson(page);
  const check = async (where: string) => {
    const visible = (await dialog.innerText()).toLowerCase();
    const labels = (
      await dialog
        .locator('[aria-label]')
        .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('aria-label') ?? ''))
    )
      .join(' ')
      .toLowerCase();
    for (const phrase of CHECKED_PHRASES) {
      expect(visible, `${phrase} in ${where}`).not.toContain(phrase);
      expect(labels, `${phrase} in ${where}`).not.toContain(phrase);
    }
  };
  for (const step of [1, 2, 3]) {
    await check(`step ${step}`);
    if (step < 3) await dialog.getByRole('button', { name: 'Дальше' }).click();
  }
  for (const name of ['Игра «Назови время»', 'Игра «Поставь стрелки»', 'Игра «Собери фразу»']) {
    await dialog.getByRole('button', { name }).click();
    await check(name);
    await dialog.getByRole('button', { name: 'К объяснению' }).click();
  }
});

for (const [width, height] of [
  [320, 568],
  [390, 844],
  [768, 1024],
  [820, 1180],
] as const) {
  test(`the clock lesson stays operable at ${width}px without motion`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    const dialog = await openLesson(page);
    for (const step of [1, 2, 3]) {
      const header = await dialog.evaluate((node) => {
        const title = node.querySelector('h2')!;
        const style = getComputedStyle(title);
        const leftover = Array.from(
          node.querySelectorAll<HTMLElement>(
            '.pilot-topline, .clock-pilot > h3, .pilot-instruction',
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
    await dialog.getByRole('button', { name: 'Игра «Поставь стрелки»' }).click();
    const pick = (await dialog.locator('[data-clock-minute="0"]').boundingBox())!;
    expect(pick.width).toBeGreaterThanOrEqual(44);
    expect(pick.height).toBeGreaterThanOrEqual(44);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
  });
}

test.describe('a touch device', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test('a finger moves the minute hand on the ring', async ({ page }) => {
    const cdp = await page.context().newCDPSession(page);
    const dialog = await openLesson(page);
    await dialog.getByRole('button', { name: 'Игра «Поставь стрелки»' }).click();
    const target = (await dialog.locator('[data-clock-minute="45"]').boundingBox())!;
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [
        {
          x: target.x + target.width / 2,
          y: target.y + target.height / 2,
          radiusX: 12,
          radiusY: 12,
        },
      ],
    });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect(dialog.locator('.clock-dial svg')).toHaveAttribute(
      'aria-label',
      /Часы показывают \d{1,2}:45:/,
    );
    await expect(dialog.locator('.clock-hand-minute')).toHaveCount(1);
    expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBeNull();
    await cdp.detach();
  });
});
