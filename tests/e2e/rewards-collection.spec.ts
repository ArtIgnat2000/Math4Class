import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createAppData, type AppData } from '../../src/engine/model';
import { REWARD_ITEMS, rewardsByShelf } from '../../src/engine/rewards';

const key = 'chislo:data:v1';

async function seed(page: Page, data: AppData) {
  await page.addInitScript(
    ({ key, data }) => {
      localStorage.setItem(key, JSON.stringify(data));
      localStorage.setItem('chislo:backup:v1', JSON.stringify(data));
    },
    { key, data },
  );
}

function profileWithLessons(lessons: number): AppData {
  const data = createAppData();
  data.profiles[0].totals = {
    tasks: lessons * 5,
    correct: lessons * 4,
    lessons,
    xp: lessons * 30,
    recovered: 0,
    perfect: 0,
  };
  return data;
}

test('коллекция скинов и вещей открывается за пройденные занятия', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seed(page, profileWithLessons(14));
  await page.goto('/#/rewards');

  await expect(page.getByRole('heading', { name: 'Скины и вещи' })).toBeVisible();
  await expect(page.locator('.collection-card')).toHaveCount(REWARD_ITEMS.length);
  await expect(page.locator('.collection-card.unlocked')).toHaveCount(14);
  await expect(page.locator('.collection-progress')).toContainText('Бонус на 15-м занятии');
  await expect(page.locator('.collection-rank')).toContainText('Пройдено 14 занятий');

  // Картинки перенесены из витрины «Слова»: файл каждой вещи должен открыться.
  await expect
    .poll(() =>
      page
        .locator('.collection-card img')
        .first()
        .evaluate((img: HTMLImageElement) => img.naturalWidth),
    )
    .toBeGreaterThan(0);

  await page.getByRole('button', { name: 'Питомцы' }).click();
  await expect(page.getByRole('button', { name: 'Питомцы' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.locator('.collection-card')).toHaveCount(rewardsByShelf('pet').length);
  await expect(page.locator('.collection-card img').first()).toHaveJSProperty('complete', true);

  expect((await new AxeBuilder({ page }).include('.collection').analyze()).violations).toEqual([]);
});

for (const width of [320, 390, 820]) {
  test(`полки и карточки коллекции не ломают экран на ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width < 500 ? 844 : 1180 });
    await seed(page, profileWithLessons(30));
    await page.goto('/#/rewards');
    await expect(page.locator('.collection-card')).toHaveCount(REWARD_ITEMS.length);

    const metrics = await page.evaluate(() => {
      const first = document.querySelector('.collection-card')!.getBoundingClientRect();
      return {
        overflow: document.documentElement.scrollWidth - window.innerWidth,
        card: Math.round(first.width),
      };
    });
    expect(metrics.overflow).toBeLessThanOrEqual(1);
    expect(metrics.card).toBeGreaterThanOrEqual(120);
  });
}

test('награду можно рассмотреть крупно и уйти в свою коллекцию', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const data = profileWithLessons(23);
  data.profiles[0].history = [
    {
      id: 'r1',
      topicId: 'page-74-test',
      topicTitle: 'Проверим себя',
      grade: 4,
      day: '2026-11-12',
      correct: 10,
      total: 10,
      assisted: 0,
      recovered: 0,
      xp: 100,
      stars: 3,
      mode: 'learn',
    },
  ];
  await seed(page, data);
  await page.goto('/#/result');

  const cards = page.locator('.result-reward-card');
  await expect(cards).toHaveCount(3);
  await cards.first().click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('Открылась за 23-е занятие');
  await expect
    .poll(() =>
      dialog.locator('.reward-modal-art').evaluate((img: HTMLImageElement) => img.naturalWidth),
    )
    .toBeGreaterThan(0);
  expect((await new AxeBuilder({ page }).include('[role="dialog"]').analyze()).violations).toEqual(
    [],
  );

  await dialog.getByRole('button', { name: 'Мои награды' }).click();
  await expect(page).toHaveURL(/#\/rewards$/);
  await expect(page.getByRole('heading', { name: 'Скины и вещи' })).toBeVisible();
});

test('бонус не выталкивает главное действие результата за экран', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  const data = profileWithLessons(12);
  data.profiles[0].history = [
    {
      id: 'r1',
      topicId: 'decimal-multiply',
      topicTitle: 'Умножение на 10 и 100',
      grade: 4,
      day: '2026-11-08',
      correct: 3,
      total: 3,
      assisted: 0,
      recovered: 0,
      xp: 30,
      stars: 3,
      mode: 'learn',
    },
  ];
  await seed(page, data);
  await page.goto('/#/result');

  const reward = page.locator('.result-reward');
  await expect(reward).toContainText('Твоя новая награда');
  await expect(reward.locator('.result-reward-card img')).toHaveAttribute(
    'src',
    /\/rewards\/.+\.webp$/,
  );
  const primary = page.locator('.result-actions').getByRole('button', { name: 'Дальше' });
  await expect(primary).toBeInViewport({ ratio: 1 });
  expect((await new AxeBuilder({ page }).include('.result-main').analyze()).violations).toEqual([]);
});
