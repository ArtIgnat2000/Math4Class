import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const { version } = JSON.parse(
  await readFile(new URL('../../package.json', import.meta.url), 'utf8'),
);

test('only source-checked tasks appear and unverified grades have no lessons', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#/topics');
  await expect(page.locator('.topic-card')).toHaveCount(6);
  await expect(page.getByRole('status').filter({ hasText: '23 задания' })).toBeVisible();
  await expect(page.getByText('Килограмм и грамм', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Многозначные числа', { exact: true })).toHaveCount(0);
  await page.getByRole('combobox', { name: 'Класс обучения' }).selectOption('1');
  await expect(page.locator('.topic-card')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Задания проверяются' })).toBeVisible();
  await page.goto('/#/learn');
  await expect(page.getByRole('button', { name: 'Ожидаем проверенные задания' })).toBeDisabled();
  await page.getByRole('button', { name: 'Открыть меню' }).click();
  await expect(page.getByLabel(`Версия приложения ${version}`)).toBeVisible();
});

test('calendar explanation is visual, separate from checked textbook exercises', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#/topics');
  await page.locator('.topic-card').filter({ hasText: 'Переводим годы в месяцы' }).first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('img', { name: /Круг года/ })).toBeVisible();
  await expect(dialog.locator('.season-cycle-item img')).toHaveCount(4);
  await dialog.getByText('Посмотреть месяцы и римские цифры').click();
  await expect(dialog.locator('.calendar-season-months > div')).toHaveCount(4);
  await expect(dialog.getByText(/IV = 4/)).toBeVisible();
  await expect(dialog.locator('.calendar-roman-grid > div')).toHaveCount(12);
  await expect(page.locator('.task-card')).toHaveCount(0);
  await dialog.getByRole('button', { name: 'Дальше' }).click();
  await expect(dialog.getByText('Открытие 2 из 3')).toBeVisible();
  await dialog.getByRole('button', { name: 'Лето' }).click();
  await expect(dialog.locator('.pilot-months')).toContainText('Июнь → Июль → Август');
  await dialog.getByRole('button', { name: 'Дальше' }).click();
  await expect(dialog.locator('.calendar-year-strip .calendar-token')).toHaveCount(12);
  await dialog.getByRole('button', { name: 'Проверить себя' }).click();
  await expect(page.locator('.task-card')).toBeVisible();
  await expect(page.getByRole('heading', { name: /4 годах|2 года 3 месяца/ })).toBeVisible();
});

test('an old lesson with invented tasks cannot be resumed from storage or a direct link', async ({
  page,
}) => {
  await page.goto('/#/topics');
  await page.locator('.topic-card').filter({ hasText: 'Уравнения: сложение и вычитание' }).click();
  await page.getByRole('button', { name: 'Давай попробуем' }).click();
  await expect(page.locator('.task-card')).toBeVisible();
  await page.evaluate(() => {
    const key = 'chislo:data:v1';
    const data = JSON.parse(localStorage.getItem(key)!);
    const profile = data.profiles.find((item: { id: string }) => item.id === data.activeProfileId);
    profile.activeSession.entries[0].task.question = 'Выдуманный вопрос, не со страницы учебника';
    localStorage.setItem(key, JSON.stringify(data));
  });
  await page.reload();
  await expect(page.locator('.task-card')).toHaveCount(0);
  await expect(page).toHaveURL(/#\/learn$/);
  await expect(page.getByRole('button', { name: 'Продолжить занятие' })).toHaveCount(0);
  await expect(page.locator('.topic-card')).toHaveCount(3);
});

test('every approved exercise stays usable on a phone and tablet', async ({ browser }) => {
  const pack = JSON.parse(
    await readFile(new URL('../../src/content/grade-4.json', import.meta.url), 'utf8'),
  );
  const { approvedTaskIds } = await import('../../src/content/approved');
  for (const [width, height] of [
    [390, 844],
    [768, 1024],
  ]) {
    const context = await browser.newContext({
      viewport: { width, height },
      isMobile: true,
      hasTouch: true,
    });
    try {
      const page = await context.newPage();
      await page.goto('/#/topics');
      for (const topic of pack.topics.filter((item: { id: string }) => approvedTaskIds[item.id])) {
        await page.locator('.topic-card').filter({ hasText: topic.title }).click();
        if (topic.id === 'calendar-years-months') {
          await page.getByRole('button', { name: 'Дальше' }).click();
          await page.getByRole('button', { name: 'Дальше' }).click();
          await page.getByRole('button', { name: 'Проверить себя' }).click();
        } else {
          await page.getByRole('button', { name: /Давай попробуем|Начать занятие/ }).click();
        }
        const confirm = page.getByRole('button', { name: 'Начать новое', exact: true });
        if (await confirm.isVisible()) await confirm.click();
        for (const id of approvedTaskIds[topic.id].ids) {
          const task = topic.tasks.find((item: { id: string }) => item.id === id);
          await page.evaluate((selected) => {
            const key = 'chislo:data:v1';
            const data = JSON.parse(localStorage.getItem(key)!);
            const profile = data.profiles.find(
              (item: { id: string }) => item.id === data.activeProfileId,
            );
            profile.activeSession.entries = [{ task: selected, retry: false }];
            profile.activeSession.initialCount = 1;
            profile.activeSession.cursor = 0;
            localStorage.setItem(key, JSON.stringify(data));
          }, task);
          await page.reload();
          await expect(page.locator('.task-card'), `${topic.id}/${id}`).toBeVisible();
          const button = page.getByRole('button', { name: 'Проверить' });
          await button.scrollIntoViewIfNeeded();
          await expect(button).toBeInViewport();
          expect(
            await page.evaluate(() => document.documentElement.scrollWidth),
          ).toBeLessThanOrEqual(width);
        }
        await page.goto('/#/topics');
      }
    } finally {
      await context.close();
    }
  }
});

for (const [width, height] of [
  [320, 568],
  [768, 1024],
] as const) {
  test(`year-month pilot remains operable at ${width}px without motion`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width, height },
      isMobile: true,
      hasTouch: true,
      reducedMotion: 'reduce',
    });
    try {
      const page = await context.newPage();
      await page.goto('/#/topics');
      await page.locator('.topic-card').filter({ hasText: 'Переводим годы в месяцы' }).click();
      const dialog = page.getByRole('dialog');
      await expect(dialog.getByRole('img', { name: /Круг года/ })).toBeVisible();
      await expect(dialog.getByRole('button', { name: 'Проверить себя' })).toHaveCount(0);
      await dialog.getByRole('button', { name: 'Дальше' }).click();
      await dialog.getByRole('button', { name: 'Осень' }).click();
      await expect(dialog.locator('.pilot-months')).toContainText('Сентябрь → Октябрь → Ноябрь');
      await dialog.getByRole('button', { name: 'Дальше' }).click();
      await expect(dialog.locator('.calendar-year-strip .calendar-token img')).toHaveCount(12);
      await dialog.getByRole('button', { name: 'Назад' }).click();
      await expect(dialog.locator('.pilot-months')).toContainText('Сентябрь');
      const next = dialog.getByRole('button', { name: 'Дальше' });
      const box = await next.boundingBox();
      expect(box!.height).toBeGreaterThanOrEqual(44);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      );
      await dialog.getByRole('button', { name: 'Закрыть окно' }).click();
      await expect(page.locator('.task-card')).toHaveCount(0);
    } finally {
      await context.close();
    }
  });
}
