import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const pack = JSON.parse(
  await readFile(new URL('../../src/content/grade-4.json', import.meta.url), 'utf8'),
);
const topic = pack.topics.find((item: { id: string }) => item.id === 'mass-kg-g');
const task = topic.tasks.find((item: { id: string }) => item.id === 'order-mass');

for (const [width, height, mobile] of [
  [390, 844, true],
  [768, 1024, true],
  [1280, 900, false],
] as const) {
  test(`reorder illustrated masses with pointer at ${width}px`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width, height },
      hasTouch: mobile,
      isMobile: mobile,
    });
    try {
      const page = await context.newPage();
      await page.goto('/#/topics');
      await page.locator('.topic-card').filter({ hasText: 'Килограмм и грамм' }).click();
      await page.getByRole('button', { name: 'Начать занятие' }).click();
      await page.evaluate((selectedTask) => {
        const key = 'chislo:data:v1';
        const data = JSON.parse(localStorage.getItem(key)!);
        const profile = data.profiles.find(
          (item: { id: string }) => item.id === data.activeProfileId,
        );
        profile.activeSession.entries[0] = { task: selectedTask, retry: false };
        profile.activeSession.cursor = 0;
        localStorage.setItem(key, JSON.stringify(data));
      }, task);
      await page.reload();
      const rows = page.locator('.illustrated-order li');
      await expect(page.locator('.mass-question-order-mass')).toHaveCount(0);
      await expect(rows).toHaveCount(4);
      for (const [label, count] of [
        ['900 г', 1],
        ['1 кг', 1],
        ['1 кг 50 г', 2],
        ['1 500 г', 2],
      ] as const) {
        const card = page.locator(
          `.illustrated-order li[data-order-id="${task.items.find((item: { label: string }) => item.label === label).id}"]`,
        );
        await expect(card.locator('.order-mass-weight img')).toHaveCount(count);
        await expect(card.locator('.order-mass-weight img').first()).toBeVisible();
      }
      await page.getByRole('button', { name: 'Гири и вес' }).click();
      const guide = page.getByRole('table', { name: 'Гири и их масса' });
      await expect(guide.locator('tbody tr')).toHaveCount(4);
      for (const label of ['1 кг', '900 г', '500 г', '50 г']) {
        const row = guide
          .locator('tbody tr')
          .filter({ has: page.getByRole('rowheader', { name: label, exact: true }) });
        const source = await row.locator('img').getAttribute('src');
        await expect(
          page
            .locator('.illustrated-order .order-mass-weight')
            .filter({ hasText: label })
            .first()
            .locator('img'),
        ).toHaveAttribute('src', source!);
        await expect(row.locator('img')).toHaveJSProperty('complete', true);
      }
      await page.getByRole('button', { name: 'Закрыть окно' }).click();
      const initial = await rows.locator('strong').allTextContents();
      const first = await rows.nth(0).boundingBox();
      const third = await rows.nth(2).boundingBox();
      expect(first && third).toBeTruthy();
      const start = { x: first!.x + first!.width / 2, y: first!.y + first!.height / 2 };
      const end = { x: third!.x + third!.width / 2, y: third!.y + third!.height / 2 };
      if (mobile) {
        const cdp = await context.newCDPSession(page);
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [start] });
        for (let step = 1; step <= 12; step++) {
          await cdp.send('Input.dispatchTouchEvent', {
            type: 'touchMove',
            touchPoints: [
              {
                x: start.x + ((end.x - start.x) * step) / 12,
                y: start.y + ((end.y - start.y) * step) / 12,
              },
            ],
          });
          if (step === 6) {
            await expect(rows.nth(0)).toHaveClass(/order-dragging/);
            const moving = await rows.nth(0).boundingBox();
            expect(Math.hypot(moving!.x - first!.x, moving!.y - first!.y)).toBeGreaterThan(15);
          }
        }
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      } else {
        await page.mouse.move(start.x, start.y);
        await page.mouse.down();
        await page.mouse.move(end.x, end.y, { steps: 12 });
        await page.mouse.up();
      }
      await expect(rows.nth(2).locator('strong')).toHaveText(initial[0]);
      const arrow = rows.nth(2).getByRole('button', { name: `Сдвинуть влево ${initial[0]}` });
      if (mobile) {
        await arrow.focus();
        await page.keyboard.press('Enter');
      } else {
        await arrow.click();
      }
      await expect(rows.nth(1).locator('strong')).toHaveText(initial[0]);
    } finally {
      await context.close();
    }
  });
}
