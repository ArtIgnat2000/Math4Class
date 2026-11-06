import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.use({ hasTouch: true });

for (const width of [320, 390, 768, 820]) {
  test(`compact learning header works at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width < 600 ? 844 : 1024 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/#/topics');
    await page
      .locator('.topic-card')
      .filter({ hasText: 'Переводим годы в месяцы' })
      .first()
      .click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('Теория');
    const geometry = await dialog.evaluate((node) => {
      const box = (selector: string) => node.querySelector(selector)!.getBoundingClientRect();
      const title = box('h2');
      const progress = box('.pilot-steps');
      const reference = box('.pilot-reference-toggle');
      const help = box('.card-guide-toggle');
      const style = getComputedStyle(node.querySelector('h2')!);
      const label = node.querySelector('.card-guide-kind')?.getBoundingClientRect() ?? title;
      return {
        titleLines: Math.round(title.height / parseFloat(style.lineHeight)),
        progressY: progress.y,
        referenceY: reference.y,
        helpY: help.y,
        labelRight: label.right,
        referenceLeft: reference.left,
        buttonWidths: [reference.width, help.width],
        buttonHeights: [reference.height, help.height],
        titleText: node.querySelector('h2')!.textContent,
      };
    });
    expect(geometry.titleLines).toBe(1);
    expect(Math.abs(geometry.progressY - geometry.referenceY)).toBeLessThan(3);
    expect(Math.abs(geometry.helpY - geometry.referenceY)).toBeLessThan(3);
    if (!geometry.titleText?.includes('Теория')) {
      expect(geometry.labelRight).toBeLessThanOrEqual(geometry.referenceLeft);
    }
    for (const size of [...geometry.buttonWidths, ...geometry.buttonHeights])
      expect(size).toBeGreaterThanOrEqual(44);
    if (width >= 768) expect(geometry.titleText).toContain('Теория');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
    expect((await new AxeBuilder({ page }).include('.modal').analyze()).violations).toEqual([]);
    await dialog.getByRole('button', { name: 'Времена года' }).click();
    await expect(dialog.getByText('В каждом времени года — 3 месяца.')).toBeVisible();
    await dialog.getByRole('button', { name: 'Справка' }).click();
    await expect(
      dialog.locator('.card-guide-content').getByText(/Нажимай «\+ месяц»/),
    ).toBeVisible();
  });
}

test('practice header keeps title, progress, exit and help separate', async ({ page }) => {
  for (const width of [320, 390, 768, 820]) {
    await page.setViewportSize({ width, height: width < 600 ? 844 : 1024 });
    await page.goto('/#/topics');
    await page
      .locator('.topic-card')
      .filter({ hasText: 'Переводим годы в месяцы' })
      .first()
      .click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Дальше' }).click();
    await dialog.getByRole('button', { name: 'Дальше' }).click();
    await dialog.getByRole('button', { name: 'Проверить себя' }).click();
    const card = page.locator('.task-card');
    await expect(card).toContainText('Годы в месяцы');
    await expect(card).toContainText('Практика');
    const layout = await card.evaluate((node) => {
      const title = node.querySelector('.task-card-title')!.getBoundingClientRect();
      const exit = node.querySelector('.task-exit')!.getBoundingClientRect();
      const progress = node.querySelector('.pilot-steps')!.getBoundingClientRect();
      const help = node.querySelector('.card-guide-toggle')!.getBoundingClientRect();
      const label = node.querySelector('.card-guide-kind')?.getBoundingClientRect();
      return {
        titleRight: title.right,
        exitLeft: exit.left,
        progressRight: progress.right,
        helpLeft: help.left,
        labelRight: label?.right ?? 0,
        titleY: title.y,
        progressY: progress.y,
        helpY: help.y,
      };
    });
    expect(layout.titleRight).toBeLessThanOrEqual(layout.exitLeft);
    expect(Math.abs(layout.progressY - layout.helpY)).toBeLessThan(10);
    expect(layout.progressY).toBeGreaterThan(layout.titleY);
    expect(Math.max(layout.progressRight, layout.labelRight)).toBeLessThanOrEqual(layout.helpLeft);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
    await page.getByRole('button', { name: 'Сохранить и выйти' }).click();
  }
});

test('portrait tablet keeps the question, keypad and check on screen', async ({ page }) => {
  for (const size of [
    { width: 768, height: 1024 },
    { width: 820, height: 1180 },
  ]) {
    await page.setViewportSize(size);
    await page.goto('/#/topics');
    await page
      .locator('.topic-card')
      .filter({ hasText: 'Уравнения: сложение и вычитание' })
      .first()
      .click();
    await page.getByRole('dialog').getByRole('button', { name: 'Давай попробуем' }).click();
    const geometry = await page.evaluate(() => ({
      scrollHeight: document.documentElement.scrollHeight,
      bottom: document.querySelector('.task-card')!.getBoundingClientRect().bottom,
      keyHeight: document.querySelector('.numeric-keypad button')!.getBoundingClientRect().height,
    }));
    expect(geometry.scrollHeight).toBeLessThanOrEqual(size.height);
    expect(geometry.bottom).toBeLessThanOrEqual(size.height - 48);
    expect(geometry.keyHeight).toBeGreaterThanOrEqual(44);
    await page.getByRole('button', { name: 'Сохранить и выйти' }).click();
  }
});

for (const width of [320, 390, 768, 820]) {
  test(`theory and practice share the same header at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width < 600 ? 844 : 1024 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/#/topics');
    await page
      .locator('.topic-card')
      .filter({ hasText: 'Переводим годы в месяцы' })
      .first()
      .click();
    const dialog = page.getByRole('dialog');
    const collect = (element: Element) => {
      const title = element.querySelector('h2, .task-card-title')!;
      const close = element.querySelector('.modal-close, .task-exit')!;
      const dot = element.querySelector('.pilot-steps i')!;
      const style = (node: Element) => {
        const s = getComputedStyle(node);
        return {
          color: s.color,
          fontSize: s.fontSize,
          fontWeight: s.fontWeight,
          lineHeight: s.lineHeight,
          letterSpacing: s.letterSpacing,
        };
      };
      const dotStyle = getComputedStyle(dot);
      const button = close.getBoundingClientRect();
      return {
        title: style(title),
        buttonWidth: button.width,
        buttonHeight: button.height,
        buttonText: close.textContent?.trim(),
        closeSvg: close.querySelector('svg')?.getAttribute('class'),
        dot: {
          width: dotStyle.width,
          height: dotStyle.height,
          border: dotStyle.border,
          background: dotStyle.backgroundColor,
          shadow: dotStyle.boxShadow,
        },
      };
    };
    const theory = await dialog.evaluate(collect);
    await dialog.getByRole('button', { name: 'Дальше' }).click();
    await dialog.getByRole('button', { name: 'Дальше' }).click();
    await dialog.getByRole('button', { name: 'Проверить себя' }).click();
    const card = page.locator('.task-card');
    const practice = await card.evaluate(collect);
    expect(practice.title).toEqual(theory.title);
    expect(practice.dot).toEqual(theory.dot);
    expect(practice.closeSvg).toBe(theory.closeSvg);
    expect(practice.buttonText).toBe('');
    expect(theory.buttonText).toBe('');
    expect(practice.buttonWidth).toBeGreaterThanOrEqual(44);
    expect(practice.buttonHeight).toBeGreaterThanOrEqual(44);
    await expect(card.getByRole('img', { name: /Задание 1 из/ })).toBeVisible();
    await expect(card.locator('.pilot-steps b')).toHaveCount(0);
    await card.getByRole('button', { name: 'Сохранить и выйти' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.task-card')).toHaveCount(0);
    const active = await page.evaluate(() => {
      const data = JSON.parse(localStorage.getItem('chislo:data:v1')!);
      return data.profiles.find((profile: { id: string }) => profile.id === data.activeProfileId)
        .activeSession;
    });
    expect(active).not.toBeNull();
    expect(active.cursor).toBe(0);
  });
}
