import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const { version } = JSON.parse(
  await readFile(new URL('../../package.json', import.meta.url), 'utf8'),
);

/**
 * A loose month is a counted unit, so its glyph must stand out against the panel
 * it sits on (WCAG 1.4.11 asks 3:1 for meaningful graphics) and must actually
 * fill its box instead of shrinking to a speck inside a large viewBox.
 */
async function looseMonthLegibility(page: import('@playwright/test').Page, selector: string) {
  return page
    .locator(selector)
    .first()
    .evaluate((token) => {
      const path = token.querySelector('path')!;
      const svg = token.querySelector('svg')!;
      const parse = (value: string) => (value.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
      const luminance = (rgb: number[]) =>
        rgb
          .map((v) => v / 255)
          .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
          .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
      let background = 'rgb(255, 255, 255)';
      for (let node = token.parentElement; node; node = node.parentElement) {
        const candidate = getComputedStyle(node).backgroundColor;
        if (candidate && candidate !== 'rgba(0, 0, 0, 0)' && candidate !== 'transparent') {
          background = candidate;
          break;
        }
      }
      const fill = luminance(parse(getComputedStyle(path).fill));
      const behind = luminance(parse(background));
      const box = svg.getBoundingClientRect();
      const glyph = path.getBBox();
      const [, , vbWidth, vbHeight] = (svg.getAttribute('viewBox') ?? '0 0 1 1')
        .split(' ')
        .map(Number);
      const scale = Math.min(box.width / vbWidth, box.height / vbHeight);
      return {
        contrast: (Math.max(fill, behind) + 0.05) / (Math.min(fill, behind) + 0.05),
        glyphWidth: glyph.width * scale,
        glyphHeight: glyph.height * scale,
      };
    });
}

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

test('calendar explanation is interactive and separate from checked textbook exercises', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#/topics');
  await expect(page.locator('.topic-description')).toHaveCount(0);
  await expect(page.locator('.task-count')).toHaveCount(0);
  await page.locator('.topic-card').filter({ hasText: 'Переводим годы в месяцы' }).first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('group', { name: 'Круг года: 12 месяцев' })).toBeVisible();
  await expect(dialog.locator('.year-clock-month')).toHaveCount(12);
  await expect(dialog.getByRole('button', { name: 'Проверить себя' })).toHaveCount(0);
  await expect(page.locator('.task-card')).toHaveCount(0);

  for (let count = 1; count <= 12; count += 1) {
    await dialog.getByRole('button', { name: '+ месяц', exact: true }).click();
    await expect(dialog.locator('.year-clock .year-sector.is-filled')).toHaveCount(count);
  }
  await expect(dialog.getByRole('status')).toContainText('1 год = 12 месяцев.');
  const seasonFills = await dialog
    .locator('.year-clock .year-sector')
    .evaluateAll((sectors) =>
      ['winter', 'spring', 'summer', 'autumn'].map(
        (season) => getComputedStyle(sectors.find((item) => item.dataset.season === season)!).fill,
      ),
    );
  expect(new Set(seasonFills).size).toBe(4);
  await dialog.getByRole('button', { name: 'Пройти ещё раз' }).click();
  await expect(dialog.locator('.year-clock .year-sector.is-filled')).toHaveCount(0);
  await dialog.getByRole('button', { name: 'Апрель — 4-й месяц года' }).click();
  await expect(dialog.getByRole('status')).toContainText('Апрель — 4-й месяц');
  await expect(dialog.getByRole('status')).toContainText('Весна');

  await dialog.getByRole('button', { name: 'Времена года' }).click();
  await expect(dialog.locator('.season-reference-row')).toHaveCount(4);
  await expect(dialog.getByText('Июнь, июль, август')).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Дальше' })).toBeInViewport();
  await dialog.getByRole('button', { name: 'Времена года' }).click();
  await expect(dialog.locator('.pilot-season-reference')).toBeHidden();

  await dialog.getByRole('button', { name: 'Дальше' }).click();
  await expect(dialog.locator('.pilot-steps')).toHaveAttribute('aria-label', 'Шаг 2 из 3');
  await expect(dialog.getByText('Шаг 2 из 3')).toHaveCount(0);
  await expect(dialog.getByText('4 класс')).toHaveCount(0);
  await expect(dialog.getByText(/Авторское объяснение/)).toHaveCount(0);
  await dialog.getByRole('button', { name: '+ год' }).click();
  await dialog.getByRole('button', { name: '+ год' }).click();
  await expect(dialog.locator('.year-group-card')).toHaveCount(3);
  await expect(dialog.locator('.year-group-card .year-sector')).toHaveCount(36);
  await expect(dialog.locator('.pilot-formula')).toContainText('12 + 12 + 12');
  await expect(dialog.locator('.pilot-formula')).toContainText('= 3 × 12');
  await expect(dialog.locator('.pilot-formula-result')).toHaveText('= 36 месяцев');
  await expect(dialog.getByText('48 месяцев')).toHaveCount(0);
  // Model tools and card navigation must not look alike.
  const controls = await dialog.locator('.model-tools').boundingBox();
  const navigation = await dialog.locator('.pilot-actions').boundingBox();
  expect(controls && navigation && navigation.y).toBeGreaterThan(
    (controls?.y ?? 0) + (controls?.height ?? 0),
  );
  const addColor = await dialog
    .locator('.model-tools .tool-add')
    .evaluate((node) => getComputedStyle(node).backgroundColor);
  const nextColor = await dialog
    .getByRole('button', { name: 'Дальше' })
    .evaluate((node) => getComputedStyle(node).backgroundColor);
  expect(addColor).not.toBe(nextColor);

  await dialog.getByRole('button', { name: 'Дальше' }).click();
  await expect(dialog.locator('.pilot-steps')).toHaveAttribute('aria-label', 'Шаг 3 из 3');
  await dialog.getByRole('button', { name: '+ месяц', exact: true }).click();
  await dialog.getByRole('button', { name: '+ месяц', exact: true }).click();
  await expect(dialog.locator('.extra-month-token')).toHaveCount(2);
  const pilotMonth = await looseMonthLegibility(page, '.extra-month-token .calendar-month-sector');
  expect(pilotMonth.contrast).toBeGreaterThanOrEqual(3);
  expect(pilotMonth.glyphWidth).toBeGreaterThanOrEqual(24);
  expect(pilotMonth.glyphHeight).toBeGreaterThanOrEqual(24);
  await expect(dialog.locator('.pilot-formula')).toContainText('= 2 × 12 + 2');
  await expect(dialog.locator('.pilot-formula-result')).toHaveText('= 26 месяцев');
  await expect(dialog.getByText('27 месяцев')).toHaveCount(0);
  await expect(dialog.getByRole('button', { name: 'Проверить себя' })).toBeInViewport();
  await expect(page.locator('.task-card')).toHaveCount(0);
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
  test.setTimeout(90_000);
  const pack = JSON.parse(
    await readFile(new URL('../../src/content/grade-4.json', import.meta.url), 'utf8'),
  );
  const { approvedTaskIds } = await import('../../src/content/approved');
  for (const [width, height] of [
    [390, 844],
    [768, 1024],
    [820, 1180],
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
          if (topic.id === 'calendar-years-months') {
            const visual = page.locator('.calendar-visual');
            await expect(visual.locator('.calendar-task-year-ring')).toHaveCount(
              id === 'four-years' ? 4 : 2,
            );
            await expect(visual.locator('.calendar-question-chip')).toHaveCount(1);
            await expect(visual.locator('img')).toHaveCount(0);
            if (id === 'two-three') {
              await expect(
                visual.locator('.calendar-month-sector-group .calendar-month-sector'),
              ).toHaveCount(3);
              const taskMonth = await looseMonthLegibility(
                page,
                '.calendar-month-sector-group .calendar-month-sector',
              );
              expect(taskMonth.contrast).toBeGreaterThanOrEqual(3);
              expect(taskMonth.glyphWidth).toBeGreaterThanOrEqual(20);
              expect(taskMonth.glyphHeight).toBeGreaterThanOrEqual(20);
            }
            await expect(page.locator('.task-card')).not.toContainText(
              id === 'four-years' ? '48' : '27',
            );
            if (width >= 768) {
              const fit = await page.evaluate(() => ({
                bottom: document.querySelector('.task-card')!.getBoundingClientRect().bottom,
                scroll: document.documentElement.scrollHeight,
                client: document.documentElement.clientHeight,
              }));
              expect(fit.scroll, `${topic.id}/${id} tablet vertical scroll`).toBeLessThanOrEqual(
                fit.client,
              );
              expect(fit.bottom, `${topic.id}/${id} keypad clearance`).toBeLessThanOrEqual(
                height - 48,
              );
            }
          }
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
  [390, 844],
  [768, 1024],
  [820, 1180],
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
      await expect(dialog.getByRole('group', { name: 'Круг года: 12 месяцев' })).toBeVisible();
      await expect(dialog.getByRole('button', { name: 'Проверить себя' })).toHaveCount(0);
      const next = dialog.getByRole('button', { name: 'Дальше' });
      await expect(next).toBeInViewport();
      expect((await next.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      await dialog.getByRole('button', { name: '+ месяц', exact: true }).click();
      await expect(dialog.locator('.year-clock .year-sector.is-filled')).toHaveCount(1);
      await next.click();
      await dialog.getByRole('button', { name: '+ год' }).click();
      await expect(dialog.locator('.year-group-card')).toHaveCount(2);
      await dialog.getByRole('button', { name: 'Дальше' }).click();
      await dialog.getByRole('button', { name: '+ месяц', exact: true }).click();
      await expect(dialog.locator('.extra-month-token')).toHaveCount(1);
      const month = await looseMonthLegibility(page, '.extra-month-token .calendar-month-sector');
      expect(month.contrast, `loose month contrast at ${width}px`).toBeGreaterThanOrEqual(3);
      expect(month.glyphWidth, `loose month size at ${width}px`).toBeGreaterThanOrEqual(24);
      await expect(dialog.getByRole('button', { name: 'Проверить себя' })).toBeInViewport();
      await dialog.getByRole('button', { name: 'Назад' }).click();
      await expect(dialog.locator('.year-group-card')).toHaveCount(2);
      await dialog.getByRole('button', { name: 'Назад' }).click();
      await expect(dialog.locator('.year-clock .year-sector.is-filled')).toHaveCount(1);
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
