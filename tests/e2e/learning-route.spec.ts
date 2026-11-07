import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
import { visiblePack } from '../../src/content/approved';
import { createAppData, type Answer, type AppData, type Session } from '../../src/engine/model';
import { createSession, finishSession, nextTask, submitAnswer } from '../../src/engine/lesson';
import { parsePack, type Task } from '../../src/engine/content';

const pack = visiblePack(
  parsePack(
    JSON.parse(readFileSync(new URL('../../src/content/grade-4.json', import.meta.url), 'utf8')),
  ),
);
const [first, second] = pack.topics;
const key = 'chislo:data:v1';

function answer(task: Task): Answer {
  if (task.type === 'number') return String(task.answer);
  if (task.type === 'division')
    return { quotient: String(task.answer.quotient), remainder: String(task.answer.remainder) };
  return task.answer;
}
function solve(session: Session): Session {
  let current = session;
  while (true) {
    current = submitAnswer(current, answer(current.entries[current.cursor].task));
    const next = nextTask(current);
    if (!next) return current;
    current = next;
  }
}
function finishedTopics(count: number): AppData {
  const data = createAppData();
  let profile = data.profiles[0];
  for (const topic of pack.topics.slice(0, count)) {
    profile = finishSession(profile, solve(createSession(topic, pack.grade))).profile;
  }
  return { ...data, profiles: [profile] };
}
async function seed(page: Page, data: AppData) {
  await page.addInitScript(
    ({ key, data }) => {
      if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(data));
    },
    {
      key,
      data,
    },
  );
}

// Start the real lesson, answer every approved task, and follow its primary action.
test('a completed lesson opens the next explanation, not the home page', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/#/learn');
  await expect(page.locator('.hero-next-topic')).toContainText(first.title);
  await expect(page.locator('.hero-next-topic')).toBeInViewport({ ratio: 1 });
  await page.getByRole('button', { name: 'Начать занятие' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Дальше' }).click();
  await dialog.getByRole('button', { name: 'Дальше' }).click();
  await dialog.getByRole('button', { name: 'Проверить себя' }).click();
  for (let i = 0; i < first.tasks.length; i++) {
    const question = await page.locator('.task-card h1').textContent();
    const task = first.tasks.find((item) => item.question === question);
    expect(task?.type).toBe('number');
    if (!task || task.type !== 'number') throw new Error(`Unknown task: ${question}`);
    await page.getByLabel('Твой ответ').fill(String(task.answer));
    await page.getByRole('button', { name: 'Проверить', exact: true }).click();
    await expect(page.getByRole('status')).toContainText('Верно!');
    await page
      .getByRole('button', { name: i === first.tasks.length - 1 ? 'Завершить занятие' : 'Дальше' })
      .click();
  }
  await expect(page.locator('.result-next')).toContainText(second.title);
  const nextButton = page.locator('.result-actions').getByRole('button', { name: 'Дальше' });
  await expect(nextButton).toBeInViewport({ ratio: 1 });
  expect((await new AxeBuilder({ page }).include('.result-main').analyze()).violations).toEqual([]);
  await nextButton.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog', { name: 'Римские цифры' })).toBeVisible();
  await expect(page.getByRole('dialog').locator('.pilot-steps')).toHaveAttribute(
    'aria-label',
    'Шаг 1 из 3',
  );
  await expect(page.locator('.task-card')).toHaveCount(0);
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).profiles[0].totals.lessons,
      key,
    ),
  ).toBe(1);
  await page.getByRole('dialog').getByRole('button', { name: 'Закрыть' }).click();
  await page.getByRole('button', { name: 'На главную' }).click();
  await page.reload();
  await expect(page.locator('.hero-next-topic')).toContainText(second.title);
  await expect(page.locator('.route-section .topic-card').first()).toContainText(second.title);
  await expect(
    page.locator('.route-section .topic-card').filter({ hasText: first.title }),
  ).toHaveCount(0);
});

for (const width of [320, 390, 768, 820]) {
  test(`home shows its only remaining topic at ${width}px and keeps completed topics in the catalog`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: width < 600 ? 844 : 1024 });
    await seed(page, finishedTopics(pack.topics.length - 1));
    await page.goto('/#/result');
    await expect(page.locator('.result-next')).toContainText(pack.topics.at(-1)!.title);
    await page.getByRole('button', { name: 'На главную' }).click();
    await expect(page).toHaveURL(/#\/learn$/);
    await expect(page.locator('.hero-next-topic')).toContainText(pack.topics.at(-1)!.title);
    const cards = page.locator('.route-section .topic-card');
    await expect(cards).toHaveCount(1);
    await expect(cards.first()).toBeVisible();
    await expect(cards.first()).toContainText(pack.topics.at(-1)!.title);
    await expect(cards.first()).toContainText('Дальше');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
    expect((await new AxeBuilder({ page }).include('.route-section').analyze()).violations).toEqual(
      [],
    );
    await page.getByRole('button', { name: 'Все темы', exact: true }).click();
    const completed = page.locator('.topic-card').filter({ hasText: first.title });
    await expect(completed).toContainText('Занятие завершено');
    await expect(completed).toBeVisible();
  });
}

test('when every available topic has been visited there is no invented next lesson', async ({
  page,
}) => {
  await seed(page, finishedTopics(pack.topics.length));
  await page.goto('/#/result');
  await expect(page.locator('.result-next')).toHaveText(
    'Ты познакомился со всеми доступными темами.',
  );
  await expect(page.locator('.result-actions').getByRole('button', { name: 'Дальше' })).toHaveCount(
    0,
  );
  await page.locator('.result-actions').getByRole('button', { name: 'На главную' }).click();
  await expect(page.locator('.route-section')).toContainText(
    'Ты познакомился со всеми доступными темами',
  );
  await expect(page.locator('.route-section .topic-card')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Повторить тему' })).toBeVisible();
});

test('a resumed lesson from another selected grade continues in its own grade', async ({
  page,
}) => {
  const data = finishedTopics(1);
  data.profiles[0].grade = 3;
  await seed(page, data);
  await page.goto('/#/result');
  await expect(page.locator('.result-next')).toContainText(second.title);
  await page.locator('.result-actions').getByRole('button', { name: 'Дальше' }).click();
  await expect(page.getByRole('dialog', { name: 'Римские цифры' })).toBeVisible();
  expect(
    await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).profiles[0].grade, key),
  ).toBe(4);
});

test('a due repetition does not hide the next new topic', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const data = finishedTopics(1);
  data.profiles[0].topics[`4:${first.id}`].dueDay = '2020-01-01';
  await seed(page, data);
  await page.goto('/#/learn');
  await expect(page.locator('.hero-next-topic')).toContainText(second.title);
  await expect(page.locator('.route-section .topic-card').first()).toContainText(second.title);
  await page.getByRole('button', { name: 'Открыть меню' }).click();
  await page.getByRole('link', { name: /Повторение/ }).click();
  await expect(page.getByRole('heading', { name: 'В самый раз для повторения' })).toBeVisible();
  await expect(page.locator('.topic-card').filter({ hasText: first.title })).toBeVisible();
});

test('the next explanation starts and saves the next lesson without losing progress', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seed(page, finishedTopics(1));
  await page.goto('/#/result');
  await page.locator('.result-actions').getByRole('button', { name: 'Дальше' }).click();
  const dialog = page.getByRole('dialog', { name: 'Римские цифры' });
  await dialog.getByRole('button', { name: 'Дальше' }).click();
  await dialog.getByRole('button', { name: 'Дальше' }).click();
  await dialog.getByRole('button', { name: 'Проверить себя' }).click();
  await expect(page.locator('.lesson-header-topic')).toContainText(second.title);
  await page.getByRole('button', { name: 'Сохранить и выйти' }).click();
  await expect(page.getByRole('button', { name: 'Продолжить занятие' })).toBeVisible();
  await expect(page.locator('.hero-next-topic')).toContainText(second.title);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Продолжить занятие' })).toBeVisible();
  const stored = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!).profiles[0],
    key,
  );
  expect(stored.totals.lessons).toBe(1);
  expect(stored.activeSession.topicId).toBe(second.id);
});

test('returning home from an earlier grade shows that grade’s next topic', async ({ page }) => {
  const data = finishedTopics(1);
  data.profiles[0].grade = 3;
  await seed(page, data);
  await page.goto('/#/result');
  await page.getByRole('button', { name: 'На главную' }).click();
  await expect(page.locator('.hero-next-topic')).toContainText(second.title);
  expect(
    await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).profiles[0].grade, key),
  ).toBe(4);
});
