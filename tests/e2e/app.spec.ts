import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { AppData, Session } from '../../src/engine/model';
const key = 'chislo:data:v1';
async function readSession(page: Page): Promise<Session> {
  return page.evaluate((key) => {
    const d = JSON.parse(localStorage.getItem(key)!) as AppData;
    return d.profiles.find((p) => p.id === d.activeProfileId)!.activeSession!;
  }, key);
}
async function openMixedLesson(page: Page) {
  await page.goto('/#/topics');
  await page.locator('.topic-card').filter({ hasText: 'Многозначные числа' }).click();
  await page.getByRole('button', { name: 'Давай попробуем' }).click();
  await expect(page.locator('.task-card')).toBeVisible();
}
async function answerCurrent(page: Page, wrong = false) {
  const session = await readSession(page);
  const task = session.entries[session.cursor].task;
  if (task.type === 'number')
    await page
      .getByLabel('Твой ответ', { exact: true })
      .fill(wrong ? '987654321' : String(task.answer));
  else if (task.type === 'division') {
    await page
      .getByLabel('Неполное частное', { exact: true })
      .fill(wrong ? String(task.answer.quotient + 1) : String(task.answer.quotient));
    await page.getByLabel('Остаток', { exact: true }).fill(String(task.answer.remainder));
  } else if (task.type === 'choice') {
    const option = task.options.find((o) => (wrong ? o.id !== task.answer : o.id === task.answer))!;
    await page
      .getByRole('button', {
        name: new RegExp(option.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      })
      .click();
  } else if (task.type === 'compare') {
    const sign = wrong ? (task.answer === '<' ? '>' : '<') : task.answer;
    await page
      .getByRole('button', {
        name: sign === '<' ? 'Меньше' : sign === '>' ? 'Больше' : 'Равно',
        exact: true,
      })
      .click();
  } else {
    const target = wrong ? [...task.answer].reverse() : task.answer;
    for (let i = 0; i < target.length; i++) {
      const label = task.items.find((item) => item.id === target[i])!.label;
      let index = (await page.locator('.order-answer li>strong').allTextContents()).indexOf(label);
      while (index > i) {
        await page.getByRole('button', { name: `Поднять ${label}`, exact: true }).click();
        index--;
      }
    }
  }
  await page.getByRole('button', { name: 'Проверить', exact: true }).click();
  await expect(page.locator('.answer-feedback')).toBeVisible();
}

test('honest first boot, grade navigation and topic filters', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Твой день открытий' })).toBeVisible();
  await expect(page.locator('.topic-card')).toHaveCount(3);
  await expect(page.locator('.goal-ring strong')).toHaveText('0/5');
  await page.getByRole('button', { name: '2 класс', exact: true }).click();
  await expect(page.getByText('Числа до 100', { exact: true })).toBeVisible();
  await page.locator('.main-nav').getByRole('link', { name: 'Все темы', exact: true }).click();
  await page.getByRole('button', { name: '4 класс', exact: true }).click();
  await expect(page.locator('.topic-card')).toHaveCount(35);
  await page.getByRole('button', { name: 'Геометрия', exact: true }).click();
  await expect(page.locator('.topic-card')).toHaveCount(2);
  await page.getByRole('button', { name: 'Все темы', exact: true }).click();
  await page.getByLabel('Поиск тем').fill('доли');
  await expect(page.locator('.topic-card')).toHaveCount(1);
  await page.getByLabel('Поиск тем').fill('абракадабра');
  await expect(page.getByRole('heading', { name: 'Такой темы пока нет' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('complete a mixed lesson, correct a mistake and retain results after reload', async ({
  page,
}) => {
  await openMixedLesson(page);
  for (let i = 0; i < 6; i++) {
    await answerCurrent(page, i === 0);
    if (i === 0) await expect(page.getByText('Почти! Давай разберёмся.')).toBeVisible();
    await page.getByRole('button', { name: /^(Дальше|Завершить занятие)$/ }).click();
  }
  await expect(page.getByRole('heading', { name: 'Ты стал на шаг увереннее!' })).toBeVisible();
  const stored = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!) as AppData,
    key,
  );
  expect(stored.profiles[0].totals).toMatchObject({
    lessons: 1,
    tasks: 5,
    correct: 4,
    recovered: 1,
  });
  expect(stored.profiles[0].activeSession).toBeNull();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Ты стал на шаг увереннее!' })).toBeVisible();
  await page.getByRole('button', { name: 'Отлично, на главную' }).click();
  await expect(page.locator('.goal-ring strong')).toHaveText('5/5');
  await page.locator('.main-nav').getByRole('link', { name: 'Мои награды' }).click();
  await expect(
    page.locator('.badge-card.unlocked').filter({ hasText: 'Первый шаг' }),
  ).toBeVisible();
});

test('save and resume a checked answer including its hint', async ({ page }) => {
  await openMixedLesson(page);
  await page.getByRole('button', { name: 'Нужна подсказка?' }).click();
  await answerCurrent(page);
  const before = await readSession(page);
  await page.getByRole('button', { name: 'Сохранить и выйти' }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Продолжить занятие' }).click();
  expect(await readSession(page)).toEqual(before);
  await expect(page.locator('.answer-feedback.is-correct')).toBeVisible();
});

test('profiles have independent grades and progress', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Открыть профили учеников' }).click();
  await page.getByRole('button', { name: 'Добавить ученика' }).click();
  await page.getByLabel('Как тебя зовут?').fill('Маша');
  await page.getByRole('dialog').getByRole('button', { name: '1 класс', exact: true }).click();
  await page.getByRole('button', { name: 'Начать свой путь' }).click();
  await expect(page.getByRole('heading', { name: 'Привет, Маша!' })).toBeVisible();
  await expect(page.getByText('Числа до 20', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Открыть профили учеников' }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: /Исследователь/ })
    .click();
  await expect(page.getByRole('heading', { name: 'Твой день открытий' })).toBeVisible();
  await expect(page.getByRole('button', { name: '4 класс', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('validate and import content, export a restorable backup', async ({ page }) => {
  await page.goto('/#/parents');
  const bad = {
    name: 'bad.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"grade":4}'),
  };
  await page.getByLabel('Файл учебных материалов').setInputFiles(bad);
  await expect(page.getByRole('alert')).toContainText('Проверьте поле');
  const pack = JSON.parse(await readFile('public/content/example-grade-4.json', 'utf8'));
  pack.topics[0].title = 'Моя тестовая тема';
  pack.isDemo = false;
  await page
    .getByLabel('Файл учебных материалов')
    .setInputFiles({ ...bad, name: 'valid.json', buffer: Buffer.from(JSON.stringify(pack)) });
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Добавить пакет', exact: true }).click();
  await expect(page.getByText('Ваши материалы', { exact: true })).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Сохранить копию/ }).click();
  const download = await downloadPromise;
  const exported = JSON.parse(await readFile((await download.path())!, 'utf8')) as AppData;
  expect(exported.version).toBe(1);
  expect(exported.customPacks[0].topics[0].title).toBe('Моя тестовая тема');
  await page.locator('.main-nav').getByRole('link', { name: 'Все темы', exact: true }).click();
  await expect(page.locator('.topic-card')).toHaveCount(1);
  await expect(page.getByText('Моя тестовая тема', { exact: true })).toBeVisible();
});

test('mobile layout has no horizontal overflow, menu and dialogs are usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Твой день открытий' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Открыть меню' }).click();
  await expect(page.locator('.sidebar')).toHaveClass(/mobile-open/);
  await page.locator('.main-nav').getByRole('link', { name: 'Все темы', exact: true }).click();
  await expect(page.locator('.sidebar')).not.toHaveClass(/mobile-open/);
  await page.locator('.topic-card').first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('production PWA can reload offline with content and progress', async ({ page, context }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '3 класс', exact: true }).click();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect(page.getByText('Числа до 1 000', { exact: true })).toBeVisible();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Твой день открытий' })).toBeVisible();
  await expect(page.getByText('Числа до 1 000', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /Начать занятие/ }).click();
  await page.getByRole('button', { name: 'Давай попробуем' }).click();
  await expect(page.locator('.task-card')).toBeVisible();
});

test('all main screens meet automated WCAG AA checks', async ({ page }) => {
  const { default: AxeBuilder } = await import('@axe-core/playwright');
  for (const route of ['learn', 'topics', 'review', 'progress', 'rewards', 'parents']) {
    await page.goto(`/#/${route}`);
    await expect(page.locator('h1')).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(results.violations, route).toEqual([]);
  }
});

test('small phones, tablets and desktops do not overflow horizontally', async ({ page }) => {
  for (const width of [320, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['learn', 'topics', 'parents', 'rewards']) {
      await page.goto(`/#/${route}`);
      await expect(page.locator('h1')).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `${route} at ${width}px`,
      ).toBe(true);
    }
  }
});

test('textbook sources, grouped catalog, page search and introductory topics are explicit', async ({
  page,
}) => {
  await page.goto('/#/topics');
  await expect(page.getByRole('heading', { name: '«Школа России»' })).toBeVisible();
  await expect(page.locator('.catalog-count')).toContainText('256 заданий');
  await expect(page.locator('.catalog-section')).toHaveCount(5);
  await page.getByRole('button', { name: 'Об учебнике и материалах' }).click();
  const source = page.getByRole('dialog');
  await expect(source).toContainText('М. А. Бантова');
  await expect(source).toContainText('Просвещение, 2026');
  await expect(source).toContainText('20 тем по фотографиям страниц');
  await expect(source).toContainText('7 тем по оглавлению');
  await expect(source).toContainText('не полный курс');
  await page.keyboard.press('Escape');
  await page.getByLabel('Раздел учебника').selectOption('calendar');
  await expect(page.locator('.topic-card')).toHaveCount(6);
  await expect(page.locator('.topic-reference')).toContainText([
    'стр. 47',
    'стр. 47',
    'стр. 47',
    'стр. 47',
    'стр. 47',
    'стр. 47',
  ]);
  await page.getByLabel('Раздел учебника').selectOption('all');
  await page.getByRole('combobox', { name: 'Материалы', exact: true }).selectOption('contents');
  await expect(page.locator('.topic-card')).toHaveCount(7);
  await page.locator('.topic-card').filter({ hasText: 'Свойства умножения' }).click();
  await expect(page.getByRole('dialog')).toContainText('Сами эти страницы не присланы');
  await page.keyboard.press('Escape');
  await page.getByRole('combobox', { name: 'Материалы', exact: true }).selectOption('page');
  await page.getByLabel('Поиск тем').fill('стр. 46');
  await expect(page.locator('.topic-card')).toHaveCount(10);
  await page.getByLabel('Поиск тем').clear();
  await page.getByRole('combobox', { name: 'Материалы', exact: true }).selectOption('intro');
  await expect(page.locator('.topic-card')).toHaveCount(8);
  await page.locator('.topic-card').first().click();
  await expect(page.getByRole('dialog')).toContainText('Демо-тема для знакомства');
});

async function openDivision(page: Page) {
  await page.goto('/#/topics');
  await page
    .locator('.topic-card')
    .filter({ hasText: 'Вводим неполное частное и остаток отдельно' })
    .click();
  await expect(page.getByRole('dialog')).toContainText('упражнения 218');
  await page.getByRole('button', { name: 'Давай попробуем' }).click();
  await expect(page.getByLabel('Неполное частное', { exact: true })).toBeVisible();
}

test('two-field division works on a small phone, saves feedback and recovers an error', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 850 });
  await openDivision(page);
  const check = page.getByRole('button', { name: 'Проверить', exact: true });
  await expect(check).toBeDisabled();
  await page.getByLabel('Неполное частное', { exact: true }).fill('0');
  await expect(check).toBeDisabled();
  await page.getByLabel('Остаток', { exact: true }).fill('1.5');
  await expect(check).toBeDisabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Нужна подсказка?' }).click();
  await answerCurrent(page, true);
  await expect(page.getByText('Почти! Давай разберёмся.')).toBeVisible();
  const before = await readSession(page);
  const answer = before.attempts[0].answer;
  if (typeof answer !== 'object' || Array.isArray(answer))
    throw new Error('Expected a two-field answer');
  await page.getByRole('button', { name: 'Сохранить и выйти' }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Продолжить занятие' }).click();
  expect(await readSession(page)).toEqual(before);
  await expect(page.getByLabel('Неполное частное', { exact: true })).toHaveValue(answer.quotient);
  await expect(page.getByLabel('Остаток', { exact: true })).toHaveValue(answer.remainder);
  await expect(page.getByLabel('Остаток', { exact: true })).toBeDisabled();
  for (let i = 1; i < 6; i++) {
    await page.getByRole('button', { name: /^(Дальше|Завершить занятие)$/ }).click();
    await answerCurrent(page);
  }
  await page.getByRole('button', { name: 'Завершить занятие', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Ты стал на шаг увереннее!' })).toBeVisible();
  const stored = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!) as AppData,
    key,
  );
  expect(stored.profiles[0].totals).toMatchObject({
    tasks: 5,
    correct: 4,
    recovered: 1,
    lessons: 1,
  });
  expect(stored.profiles[0].topics['4:division-remainder'].level).toBe(1);
});

test('source dialog and quotient/remainder inputs pass automated accessibility checks', async ({
  page,
}) => {
  const { default: AxeBuilder } = await import('@axe-core/playwright');
  const check = async () => {
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(result.violations).toEqual([]);
  };
  await page.goto('/');
  await page.getByRole('button', { name: 'Об учебнике и материалах' }).click();
  await check();
  await page.keyboard.press('Escape');
  await openDivision(page);
  await check();
  await answerCurrent(page, true);
  await check();
});

test('expanded textbook content and two-field progress remain available offline', async ({
  page,
  context,
}) => {
  await openDivision(page);
  await answerCurrent(page);
  const before = await readSession(page);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect(page.locator('.answer-feedback.is-correct')).toBeVisible();
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('.answer-feedback.is-correct')).toBeVisible();
  expect(await readSession(page)).toEqual(before);
  await page.getByRole('button', { name: 'Сохранить и выйти' }).click();
  await page.locator('.main-nav').getByRole('link', { name: 'Все темы', exact: true }).click();
  await expect(page.locator('.topic-card')).toHaveCount(35);
  await page.getByLabel('Раздел учебника').selectOption('calendar');
  await expect(page.locator('.topic-card')).toHaveCount(6);
  await expect(page.getByRole('heading', { name: '«Школа России»' })).toBeVisible();
});

test('premium pilot keeps the props, gives optional reference and saves exit from the card', async ({
  page,
}) => {
  await page.goto('/#/topics');
  await page.locator('.topic-card').filter({ hasText: 'Килограмм и грамм' }).click();
  await page.getByRole('button', { name: 'Давай попробуем' }).click();
  await expect(page.getByRole('heading', { name: 'Сколько граммов в 3 кг?' })).toBeVisible();
  await expect(page.locator('.mass-object-weight img')).toHaveCount(3);
  await expect(
    page.getByRole('img', { name: 'Три отдельные гири, на каждой написано 1 кг' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Таблица единиц' }).click();
  expect((await readSession(page)).hintOpen).toBe(false);
  await page.getByRole('button', { name: 'Все единицы массы' }).click();
  await expect(page.getByRole('table', { name: 'Единицы массы' })).toContainText('1 ц = 100 кг');
  await page.getByRole('button', { name: 'Скрыть Бука' }).click();
  await expect(page.locator('.mass-object-weight img')).toHaveCount(3);
  await page.getByRole('button', { name: 'Показать Бука' }).click();
  await page.getByRole('button', { name: 'Подсказка', exact: true }).click();
  expect((await readSession(page)).hintOpen).toBe(true);
  await page.getByRole('button', { name: 'Сохранить занятие и выйти' }).click();
  await expect(page.getByRole('heading', { name: 'Твой день открытий' })).toBeVisible();
  await page.getByRole('button', { name: 'Продолжить занятие' }).click();
  expect((await readSession(page)).hintOpen).toBe(true);
  await answerCurrent(page);
  await expect(page.getByText('Верно!', { exact: true })).toBeVisible();
});

test('premium mass lesson and its reference meet automated WCAG AA checks on phone', async ({
  page,
}) => {
  const { default: AxeBuilder } = await import('@axe-core/playwright');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#/topics');
  await page.locator('.topic-card').filter({ hasText: 'Килограмм и грамм' }).click();
  await page.getByRole('button', { name: 'Давай попробуем' }).click();
  await page.getByRole('button', { name: 'Таблица единиц' }).click();
  await page.getByRole('button', { name: 'Все единицы массы' }).click();
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(result.violations).toEqual([]);
});
