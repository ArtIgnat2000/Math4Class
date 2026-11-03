import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const pack = JSON.parse(
  await readFile(new URL('../../src/content/grade-4.json', import.meta.url), 'utf8'),
);
const task = pack.topics
  .find((topic: { id: string }) => topic.id === 'mass-tonne-centner')
  .tasks.find((entry: { id: string }) => entry.id === 'order');

for (const [width, height, touch] of [
  [320, 640, true],
  [390, 844, true],
  [768, 1024, true],
  [1280, 900, false],
] as const) {
  test(`drag pictured centner loads at ${width}px`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width, height },
      hasTouch: touch,
      isMobile: touch,
    });
    try {
      const page = await context.newPage();
      await page.goto('/#/topics');
      await page.locator('.topic-card').filter({ hasText: 'Тонна, центнер, килограмм' }).click();
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
      const cards = page.locator('.illustrated-order li');
      await expect(cards).toHaveCount(4);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      );
      await expect(page.locator('.centner-question-visual')).toHaveCount(0);
      const images = [1, 1, 9, 1];
      for (const label of ['80 кг', '1 ц', '9 ц', '1 т']) {
        const card = cards.filter({ has: page.locator('strong').filter({ hasText: label }) });
        await expect(card.locator('.centner-order-picture img')).toHaveCount(
          images[['80 кг', '1 ц', '9 ц', '1 т'].indexOf(label)],
        );
      }
      await page.getByRole('button', { name: 'Грузы и масса' }).click();
      const guide = page.getByRole('table', { name: 'Грузы и их масса' });
      await expect(guide.locator('thead th')).toHaveText(['Груз', 'Масса']);
      await expect(guide.locator('tbody th[scope="row"]')).toHaveText([
        '1 т',
        '9 ц',
        '1 ц',
        '80 кг',
      ]);
      await expect(guide.locator('tbody tr').nth(1).locator('img')).toHaveCount(9);
      await page.getByRole('button', { name: 'Закрыть окно' }).click();
      const original = await cards.locator('strong').allTextContents();
      const first = await cards.nth(0).boundingBox();
      const third = await cards.nth(2).boundingBox();
      const start = { x: first!.x + first!.width / 2, y: first!.y + first!.height / 2 };
      const end = { x: third!.x + third!.width / 2, y: third!.y + third!.height / 2 };
      if (touch) {
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
        }
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      } else {
        await page.mouse.move(start.x, start.y);
        await page.mouse.down();
        await page.mouse.move(end.x, end.y, { steps: 12 });
        await page.mouse.up();
      }
      await expect(cards.nth(2).locator('strong')).toHaveText(original[0]);
      const arrow = cards.nth(2).getByRole('button', { name: `Сдвинуть влево ${original[0]}` });
      if (touch) {
        await arrow.focus();
        await page.keyboard.press('Enter');
      } else await arrow.click();
      await expect(cards.nth(1).locator('strong')).toHaveText(original[0]);
    } finally {
      await context.close();
    }
  });
}
