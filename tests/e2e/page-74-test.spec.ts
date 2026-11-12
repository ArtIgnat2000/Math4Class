import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// A real phone reports a coarse pointer; the 44 px targets on small screens rely on it.
test.use({ hasTouch: true });

/**
 * The printed test in order. Choice questions name the correct option card;
 * question 5 is answered by putting a sign inside the expression itself.
 */
const steps: { question: string; option?: string; sign?: string }[] = [
  { question: 'Какое число надо прибавить к числу 5 300, чтобы получить 6 000?', option: 'Б 700' },
  { question: 'Из какого числа вычли 800, если получили 700?', option: 'А 1 500' },
  { question: 'Значение какого выражения равно 2 800?', option: 'Б 3 000 − 200' },
  { question: 'Укажи значение числового выражения.', option: 'Б 200' },
  {
    question: 'Какой знак сравнения надо поставить в кружок, чтобы получить верное неравенство?',
    sign: 'Больше',
  },
  {
    question:
      'Выбери верное выражение для решения задачи: «Оля сорвала 15 тюльпанов. Несколько тюльпанов она поставила в 2 вазы, по 3 тюльпана в каждую, а остальные связала в букет. Сколько тюльпанов в букете?»',
    option: 'Б 15 − 3 · 2',
  },
  {
    question: 'Укажи правильно вычисленную сумму чисел 48 679 и 32 976.',
    option: 'Б 48 679 + 32 976 = 81 655',
  },
  {
    question: 'Укажи правильно вычисленную разность чисел 72 435 и 25 796.',
    option: 'Б 72 435 − 25 796 = 46 639',
  },
  {
    question:
      'Какое число надо записать в окошко, чтобы стало верным равенство 8 200 + □ = 10 000 − 1 000?',
    option: 'Б 800',
  },
  { question: 'Какой может быть длина нового чертёжного карандаша?', option: 'В 19 см' },
];

test('the page-74 test is its own catalog section and counts as an ordinary lesson', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#/topics');
  const section = page.locator('.catalog-section').filter({ hasText: 'Проверочная работа' });
  await expect(section.getByRole('heading', { name: 'Проверочная работа' })).toBeVisible();
  await section.locator('.topic-card').filter({ hasText: 'Проверим себя' }).click();

  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('10 заданий')).toBeVisible();
  await expect(dialog.getByText('Проверим себя', { exact: true }).first()).toBeVisible();
  await dialog.getByRole('button', { name: 'Давай попробуем' }).click();

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
      await expect(card.locator('.compare-placeholder')).toHaveText('>');
      await expect(card).toContainText('3 800 − (1 900 − 900)');
      await expect(card).toContainText('3 800 − 1 900');
    } else {
      await card.getByRole('button', { name: step.option!, exact: true }).click();
    }

    if (index === 6 || index === 7) {
      // Tasks 7–8 keep the written column of the textbook, one per option.
      await expect(card.locator('.column-choice')).toHaveCount(2);
      await expect(card.locator('.column-choice').first()).toContainText(
        index === 6 ? '48679' : '72435',
      );
      await expect(card.locator('.column-choice').last()).toContainText(
        index === 6 ? '81655' : '46639',
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
  await expect(page.locator('.result-topic')).toHaveText('Проверим себя');
  await expect(page.locator('.result-summary')).toHaveText('10 из 10 с первого раза');
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).profiles[0].topics['4:page-74-test'],
      'chislo:data:v1',
    ),
  ).toMatchObject({ sessions: 1, correct: 10, total: 10, bestStars: 3 });
});

test('the test card fits a small phone, keeps 44 px targets and shows the columns', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#/topics');
  await page.locator('.topic-card').filter({ hasText: 'Проверим себя' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Давай попробуем' }).click();
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
