import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { CANONICAL_APP_URL } from '../../src/engine/share';
import { readFileSync } from 'node:fs';

const { version } = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
) as {
  version: string;
};

const sizes = [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 820, height: 1180 },
];

test('QR-код открывается рядом с кнопкой «Поделиться» и ведёт на опубликованное приложение', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  // В тестовом Chromium нет системного «Поделиться»: проверяем предсказуемый сценарий с копированием.
  await page.addInitScript(() => {
    Reflect.deleteProperty(Navigator.prototype, 'share');
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });

  for (const size of sizes) {
    await page.setViewportSize(size);
    await page.goto('/#/learn');
    if (await page.getByRole('button', { name: 'Открыть меню' }).isVisible()) {
      await page.getByRole('button', { name: 'Открыть меню' }).click();
    }
    // Номер сборки виден в меню, а обычный способ поделиться остался на месте.
    await expect(page.getByText(`v${version}`)).toBeVisible();
    await expect(page.getByRole('button', { name: /Поделиться приложением/ })).toBeVisible();
    await page.getByRole('button', { name: /Показать QR-код/ }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    await expect(dialog.getByRole('heading', { name: 'Покажите QR-код' })).toBeVisible();

    const qr = dialog.locator('svg.share-qr-code');
    await expect(qr).toBeVisible();
    await expect(
      dialog.getByRole('img', { name: /QR-код со ссылкой на приложение/ }),
    ).toBeVisible();
    expect(await qr.locator('path').count()).toBeGreaterThan(0);
    const box = await qr.boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(180);
    expect(box!.width).toBeLessThanOrEqual(240);

    await expect(dialog.getByRole('textbox', { name: 'Ссылка на приложение' })).toHaveValue(
      CANONICAL_APP_URL,
    );
    await expect(dialog).toContainText('На экран Домой');
    await expect(dialog).toContainText('Установить приложение');

    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      size.width,
    );
    expect((await new AxeBuilder({ page }).include('.modal').analyze()).violations).toEqual([]);

    await dialog.getByRole('button', { name: /Скопировать ссылку/ }).click();
    await expect(dialog.getByRole('status')).toContainText('Ссылка скопирована');
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe(CANONICAL_APP_URL);

    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
  }
});

test('ссылка копируется и из обычной кнопки, а «Поделиться…» появляется при поддержке', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.addInitScript(() => {
    Reflect.deleteProperty(Navigator.prototype, 'share');
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#/learn');
  await page.getByRole('button', { name: 'Открыть меню' }).click();
  await page.getByRole('button', { name: /Поделиться приложением/ }).click();
  await expect(page.locator('.share-app-notice')).toContainText('Ссылка на приложение скопирована');

  // Системное «Поделиться» есть — в диалоге появляется дополнительная кнопка.
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: () => Promise.resolve(),
    });
  });
  await page.getByRole('button', { name: /Показать QR-код/ }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('button', { name: /Поделиться…/ })).toBeVisible();
  await dialog.getByRole('button', { name: /Поделиться…/ }).click();
  await expect(dialog.getByRole('status')).toContainText('Спасибо, что делитесь');
});
