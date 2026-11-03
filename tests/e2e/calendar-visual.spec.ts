import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const pack = JSON.parse(
  await readFile(new URL('../../src/content/grade-4.json', import.meta.url), 'utf8'),
);
const topics = pack.topics.filter((item: { id: string }) => item.id.startsWith('calendar-'));

for (const [width, height] of [
  [320, 640],
  [390, 844],
  [768, 1024],
  [820, 1180],
] as const) {
  for (const topic of topics) {
    test(`${topic.id} illustrates each question at ${width}px`, async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width, height },
        isMobile: true,
        hasTouch: true,
      });
      try {
        const page = await context.newPage();
        await page.goto('/#/topics');
        await page.locator('.topic-card').filter({ hasText: topic.title }).click();
        await expect(page.getByRole('dialog').locator('.calendar-intro-seasons img')).toHaveCount(
          4,
        );
        await page.getByRole('button', { name: 'Начать занятие' }).click();
        for (const selected of topic.tasks) {
          await page.evaluate((task) => {
            const key = 'chislo:data:v1';
            const data = JSON.parse(localStorage.getItem(key)!);
            const profile = data.profiles.find(
              (item: { id: string }) => item.id === data.activeProfileId,
            );
            profile.activeSession.entries[0] = { task, retry: false };
            profile.activeSession.cursor = 0;
            localStorage.setItem(key, JSON.stringify(data));
          }, selected);
          await page.reload();
          if (selected.type === 'order') {
            await expect(page.locator('.illustrated-order li')).toHaveCount(4);
            await expect(
              page.locator('.illustrated-order .calendar-token img').first(),
            ).toHaveJSProperty('complete', true);
          } else {
            const picture = page.locator('.calendar-visual');
            await expect(picture).toBeVisible();
            await expect(picture.locator('.calendar-token')).not.toHaveCount(0);
            await expect(picture.locator('img').first()).toHaveJSProperty('complete', true);
          }
          expect(
            await page.evaluate(() => document.documentElement.scrollWidth),
          ).toBeLessThanOrEqual(width);
          if (width >= 768 && selected.type === 'number') {
            const bottom = await page
              .locator('.task-card')
              .evaluate((element) => element.getBoundingClientRect().bottom);
            expect(
              bottom,
              `${topic.id}/${selected.id} should leave 48px for the keypad`,
            ).toBeLessThan(height - 48);
          }
        }
      } finally {
        await context.close();
      }
    });
  }
}

for (const topicId of ['calendar-months', 'calendar-seasons']) {
  test(`${topicId} cards reorder by touch and mouse`, async ({ browser }) => {
    const topic = topics.find((item: { id: string }) => item.id === topicId);
    const task = topic.tasks.find((item: { type: string }) => item.type === 'order');
    for (const touch of [true, false]) {
      const context = await browser.newContext({
        viewport: { width: touch ? 390 : 1280, height: 900 },
        isMobile: touch,
        hasTouch: touch,
      });
      try {
        const page = await context.newPage();
        await page.goto('/#/topics');
        await page.locator('.topic-card').filter({ hasText: topic.title }).click();
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
        const label = await cards.nth(0).locator('strong').first().textContent();
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
        await expect(cards.nth(2).locator('strong').last()).toHaveText(label!);
      } finally {
        await context.close();
      }
    }
  });
}
