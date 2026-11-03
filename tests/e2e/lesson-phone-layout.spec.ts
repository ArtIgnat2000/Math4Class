import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const packs = await Promise.all(
  [1, 2, 3, 4].map(async (grade) => ({
    grade,
    topics: JSON.parse(
      await readFile(new URL(`../../src/content/grade-${grade}.json`, import.meta.url), 'utf8'),
    ).topics,
  })),
);

async function openLesson(page: import('@playwright/test').Page) {
  await page.goto('/#/topics');
  await page.locator('.topic-card').filter({ hasText: 'Килограмм и грамм' }).click();
  await page.getByRole('button', { name: 'Начать занятие' }).click();
}

async function showTask(
  page: import('@playwright/test').Page,
  grade: number,
  topic: { id: string; title: string },
  task: { id: string },
) {
  await page.evaluate(
    ({ grade, topic, task }) => {
      const key = 'chislo:data:v1';
      const data = JSON.parse(localStorage.getItem(key)!);
      const profile = data.profiles.find(
        (item: { id: string }) => item.id === data.activeProfileId,
      );
      profile.grade = grade;
      profile.activeSession = {
        id: 'layout-check',
        grade,
        topicId: topic.id,
        topicTitle: topic.title,
        mode: 'learn',
        startedAt: Date.now(),
        entries: [{ task, retry: false }],
        initialCount: 1,
        cursor: 0,
        attempts: [],
        hintOpen: false,
        feedback: null,
      };
      localStorage.setItem(key, JSON.stringify(data));
    },
    { grade, topic, task },
  );
  await page.goto('/#/lesson');
  await page.reload();
}

test('every lesson card fits a standard phone without scrolling', async ({ browser }) => {
  test.setTimeout(180_000);
  const height = 844;
  const context = await browser.newContext({
    viewport: { width: 390, height },
    isMobile: true,
    hasTouch: true,
  });
  try {
    const page = await context.newPage();
    await openLesson(page);
    for (const pack of packs) {
      for (const topic of pack.topics) {
        for (const task of topic.tasks) {
          await showTask(page, pack.grade, topic, task);
          const size = await page.evaluate(() => ({
            bottom: document.querySelector('.task-card')!.getBoundingClientRect().bottom,
            scrollHeight: document.documentElement.scrollHeight,
            exitHeight: document.querySelector('.task-exit')!.getBoundingClientRect().height,
            keypadHeights: [...document.querySelectorAll('.numeric-keypad button')].map(
              (button) => button.getBoundingClientRect().height,
            ),
          }));
          const label = `${pack.grade}/${topic.id}/${task.id}`;
          expect(size.bottom, label).toBeLessThanOrEqual(height - 16);
          expect(size.scrollHeight, label).toBeLessThanOrEqual(height);
          expect(size.exitHeight, label).toBeGreaterThanOrEqual(44);
          expect(
            size.keypadHeights.every((buttonHeight) => buttonHeight >= 44),
            label,
          ).toBe(true);
        }
      }
    }
  } finally {
    await context.close();
  }
});

test('short phones can scroll to the entire answer and exit instead of clipping it', async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 320, height: 568 },
    isMobile: true,
    hasTouch: true,
  });
  try {
    const page = await context.newPage();
    await openLesson(page);
    for (const [topicId, taskId] of [
      ['calendar-months', 'month-count'],
      ['mass-tonne-centner', 'mixed-tonnes'],
      ['area-equal-parts', 'square-4'],
    ]) {
      const topic = packs[3].topics.find((item: { id: string }) => item.id === topicId);
      const task = topic.tasks.find((item: { id: string }) => item.id === taskId);
      await showTask(page, 4, topic, task);
      await expect(page.locator('.task-exit')).toBeVisible();
      const submit = page.locator('.task-footer button');
      await submit.scrollIntoViewIfNeeded();
      await expect(submit).toBeInViewport();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        320,
      );
    }
  } finally {
    await context.close();
  }
});
