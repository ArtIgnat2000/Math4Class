import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// A real phone reports a coarse pointer; the 44 px targets on small screens rely on it.
test.use({ hasTouch: true });

/**
 * The printed second variant in order. Choice questions name the correct option card;
 * question 5 is answered by putting a sign inside the expression itself.
 */
const steps: { question: string; option?: string; sign?: string }[] = [
  {
    question: 'Какое число надо прибавить к числу 2 400, чтобы получить 4 000?',
    option: 'А 1 600',
  },
  { question: 'Из какого числа вычли 300, если получили 900?', option: 'В 1 200' },
  { question: 'Значение какого выражения равно 1 600?', option: 'В 2 300 − 700' },
  { question: 'Укажи значение числового выражения.', option: 'А 170' },
  {
    question: 'Какой знак сравнения надо поставить в кружок, чтобы получить верное неравенство?',
    sign: 'Меньше',
  },
  {
    question:
      'Выбери верное выражение для решения задачи: «В 2 одинаковые банки с ананасовым компотом кладут 18 кружков ананаса. Сколько кружков ананаса нужно положить в 6 таких банок?»',
    option: 'Б 18 : 2 · 6',
  },
  {
    question: 'Укажи правильно вычисленную сумму чисел 38 697 и 42 538.',
    option: 'Б 38 697 + 42 538 = 81 235',
  },
  {
    question: 'Укажи правильно вычисленную разность чисел 81 423 и 29 873.',
    option: 'Б 81 423 − 29 873 = 51 550',
  },
  {
    question:
      'Какое число надо записать в окошко, чтобы стало верным равенство 9 400 + □ = 10 250 − 250?',
    option: 'А 600',
  },
  { question: 'Какой может быть масса кошки, которой один год?', option: 'Б 3 кг' },
];

test('the page-75 variant is its own card in the assessment section and counts as an ordinary lesson', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#/topics');
  const section = page.locator('.catalog-section').filter({ hasText: 'Проверочная работа' });
  await expect(section.getByRole('heading', { name: 'Проверочная работа' })).toBeVisible();
  // Both variants of the textbook check live in the same section.
  await expect(section.locator('.topic-card')).toHaveCount(2);
  await section.locator('.topic-card').filter({ hasText: 'вариант 2' }).click();

  const dialog = page.getByRole('dialog');
  await expect(dialog.locator('.test-intro-meta')).toContainText('10 заданий');
  await expect(dialog.locator('.test-intro-meta')).toContainText('10 минут');
  await expect(dialog.getByRole('heading', { name: 'Проверим себя · вариант 2' })).toBeVisible();
  await expect(dialog.locator('.test-intro-list li')).toHaveCount(3);
  await dialog.getByRole('button', { name: 'Начать тест' }).click();

  const card = page.locator('.task-card');
  await expect(card).toBeVisible();
  for (const [index, step] of steps.entries()) {
    // The printed number of the question is visible, exactly as in the table.
    await expect(card.locator('.task-source-number')).toHaveText(`Задание ${index + 1}`);
    await expect(page.locator('.pilot-steps')).toHaveAttribute(
      'aria-label',
      `Задание ${index + 1} из 10`,
    );
    await expect(card.locator('h1')).toHaveText(step.question);

    if (step.sign) {
      await card.getByRole('button', { name: step.sign, exact: true }).click();
      await expect(card.locator('.compare-placeholder')).toHaveText('<');
      await expect(card).toContainText('5 600 − (300 + 600)');
      await expect(card).toContainText('5 600 − 300 + 600');
    } else {
      await card.getByRole('button', { name: step.option!, exact: true }).click();
    }

    if (index === 6 || index === 7) {
      // Tasks 7–8 keep the written column of the textbook, one per option.
      await expect(card.locator('.column-choice')).toHaveCount(2);
      await expect(card.locator('.column-choice').first()).toContainText(
        index === 6 ? '38697' : '81423',
      );
      await expect(card.locator('.column-choice').last()).toContainText(
        index === 6 ? '81235' : '51550',
      );
    }

    await page.getByRole('button', { name: 'Проверить', exact: true }).click();
    await expect(page.getByRole('status')).toContainText('Верно!');
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
      `step ${index + 1} sideways scroll`,
    ).toBeLessThanOrEqual(390);
    await page
      .getByRole('button', {
        name: index === steps.length - 1 ? 'Завершить занятие' : 'Дальше',
      })
      .click();
  }

  await expect(page).toHaveURL(/#\/result$/);
  await expect(page.getByRole('heading', { name: 'Готово!' })).toBeVisible();
  await expect(page.locator('.result-topic')).toHaveText('Проверим себя · вариант 2');
  await expect(page.locator('.result-summary')).toHaveText('10 из 10 с первого раза');
  // The second variant keeps its own progress and does not touch the first one.
  const topics = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!).profiles[0].topics,
    'chislo:data:v1',
  );
  expect(topics['4:page-75-test']).toMatchObject({
    sessions: 1,
    correct: 10,
    total: 10,
    bestStars: 3,
  });
  expect(topics['4:page-74-test']).toBeUndefined();
});

test('the variant card fits a small phone, keeps 44 px targets and shows the columns', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#/topics');
  await page.locator('.topic-card').filter({ hasText: 'вариант 2' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Начать тест' }).click();
  const card = page.locator('.task-card');
  await expect(card).toBeVisible();
  await expect(card.locator('.task-source-number')).toHaveText('Задание 1');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);

  const check = page.getByRole('button', { name: 'Проверить', exact: true });
  await check.scrollIntoViewIfNeeded();
  await expect(check).toBeInViewport();
  expect((await check.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  for (const option of await card.locator('.choice-option').all()) {
    const box = (await option.boundingBox())!;
    expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(44);
  }
  expect((await new AxeBuilder({ page }).include('.task-card').analyze()).violations).toEqual([]);
});

test('the start sheet of the variant is accessible and does not scroll its title away', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#/topics');
  await page.locator('.topic-card').filter({ hasText: 'вариант 2' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.locator('.test-intro-lead')).toContainText('вычисления, сравнение, задача');
  await expect(dialog.locator('.test-intro-start')).toBeInViewport();
  expect(
    (await new AxeBuilder({ page }).include('.test-intro-dialog').analyze()).violations,
  ).toEqual([]);
});
