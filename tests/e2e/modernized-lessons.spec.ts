import { expect, test, type Page, type Locator } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {
  decimalModel,
  DECIMAL_SCENES,
  formatDecimal,
  type DecimalKind,
} from '../../src/engine/decimal-lessons';
import { STORAGE_KEY } from '../../src/state/storage';

const topics = [
  {
    id: 'area',
    title: 'Площадь равных частей',
    games: ['Найди часть', 'Собери половину'],
    forbidden: /\b16\b/,
  },
  {
    id: 'powers',
    title: 'Умножаем и делим на 10, 100, 1 000',
    games: ['Найди результат', 'Собери число'],
    forbidden: /\b(?:706\s?000|800\s?000|1\s?000\s?000|100\s?000)\b/,
  },
  {
    id: 'place',
    title: 'Считаем по разрядам',
    games: ['Найди результат', 'Собери число'],
    forbidden: /\b(?:23\s?025|18\s?350|37\s?480|50|80|69\s?005|3\s?506)\b/,
  },
] as const;
async function noLeak(dialog: Locator, forbidden: RegExp) {
  const visible = await dialog.innerText();
  const labels = await dialog
    .locator('[aria-label]')
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('aria-label')).join(' '));
  expect(`${visible} ${labels}`.replace(/[\u00a0\u202f]/g, ' ')).not.toMatch(forbidden);
}
async function checkLayout(page: Page, dialog: Locator, width: number) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    width,
  );
  const sizes = await dialog.locator('button:visible').evaluateAll((nodes) =>
    nodes.map((node) => {
      const rect = node.getBoundingClientRect();
      return Math.min(rect.height, rect.width);
    }),
  );
  for (const size of sizes) expect(size).toBeGreaterThanOrEqual(44);
  expect((await new AxeBuilder({ page }).include('.modal').analyze()).violations).toEqual([]);
}
for (const topic of topics)
  for (const [width, height] of [
    [320, 568],
    [390, 844],
    [768, 1024],
    [820, 1180],
  ] as const) {
    test(`${topic.id}: interactive explanation and games at ${width}px`, async ({ browser }) => {
      // Nine axe analyses plus the practice round; the widest viewport needs more than 45 s.
      test.setTimeout(120_000);
      const context = await browser.newContext({
        viewport: { width, height },
        isMobile: true,
        hasTouch: true,
        reducedMotion: 'reduce',
      });
      try {
        const page = await context.newPage();
        await page.goto('/#/topics');
        await page.locator('.topic-card').filter({ hasText: topic.title }).click();
        const dialog = page.getByRole('dialog');
        for (let step = 1; step <= 3; step++) {
          await expect(dialog.getByLabel(`Шаг ${step} из 3`)).toBeVisible();
          if (width === 320) {
            const entries = dialog.getByRole('group', { name: 'Игры' }).getByRole('button');
            const nav = (await dialog.locator('.pilot-actions').boundingBox())!;
            for (const button of await entries.all()) {
              const rect = (await button.boundingBox())!;
              expect(rect.y).toBeGreaterThanOrEqual(0);
              expect(rect.y + rect.height).toBeLessThanOrEqual(nav.y + 1);
            }
            await expect(dialog.locator('.pilot-formula')).toBeInViewport();
          }
          await dialog.getByRole('group', { name: 'Инструменты модели' }).getByRole('button').tap();
          await noLeak(dialog, topic.forbidden);
          await checkLayout(page, dialog, width);
          for (const gameName of topic.games) {
            await dialog.getByRole('button', { name: new RegExp(`игра «${gameName}»`) }).tap();
            const game = dialog.locator(topic.id === 'area' ? '.area-game' : '.decimal-game');
            await noLeak(dialog, topic.forbidden);
            await checkLayout(page, dialog, width);
            if (topic.id === 'area' && gameName === 'Найди часть') {
              await game.getByRole('button', { name: '8 см²' }).tap();
              await expect(game.getByRole('status')).toContainText('Раздели');
              await game.getByRole('button', { name: '9 см²' }).tap();
              await expect(game.getByRole('status')).toContainText('36 : 4 = 9');
            } else if (topic.id === 'area') {
              await game.getByRole('button', { name: 'Верхняя' }).tap();
              await game.getByRole('button', { name: 'Левая' }).tap();
              await game.getByRole('button', { name: 'Готово' }).tap();
              await expect(game.getByRole('status')).toContainText('9 + 9 = 18');
            } else if (gameName === 'Найди результат') {
              const result = decimalModel(DECIMAL_SCENES[topic.id as DecimalKind][0][0]).result;
              await game
                .getByRole('group', { name: 'Выбери результат' })
                .getByRole('button', { name: formatDecimal(result), exact: true })
                .tap();
              await expect(game.getByRole('button', { name: 'Дальше' })).toBeVisible();
            } else {
              const digits = decimalModel(DECIMAL_SCENES[topic.id as DecimalKind][0][0]).digits;
              for (const digit of digits)
                await game
                  .getByRole('group', { name: 'Выбери цифру' })
                  .getByRole('button', { name: String(digit), exact: true })
                  .tap();
              await expect(game.getByRole('status')).toContainText('Получилось');
            }
            await noLeak(dialog, topic.forbidden);
            await game.getByRole('button', { name: 'Подсказка' }).tap();
            await game.getByRole('button', { name: 'К объяснению' }).tap();
            await expect(dialog.getByLabel(`Шаг ${step} из 3`)).toBeVisible();
          }
          if (step < 3) await dialog.getByRole('button', { name: 'Дальше' }).tap();
        }
        expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBeNull();
        await dialog.getByRole('button', { name: 'Проверить себя' }).tap();
        const answer = page.getByLabel('Твой ответ');
        await answer.fill('123');
        await page.getByRole('button', { name: 'Объяснение' }).tap();
        const reference = page.getByRole('dialog');
        await noLeak(reference, topic.forbidden);
        await reference.getByRole('button', { name: 'К заданию' }).tap();
        await expect(answer).toHaveValue('123');
      } finally {
        await context.close();
      }
    });
  }
