import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CANONICAL_APP_URL, appShareUrl } from '../src/engine/share';
import { ShareDialog } from '../src/ui/ShareDialog';

function withClipboard(writeText: (text: string) => Promise<void>) {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  });
}

afterEach(() => {
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
  Reflect.deleteProperty(navigator, 'share');
});

describe('ссылка на приложение', () => {
  it('на опубликованном адресе оставляет свой origin и путь', () => {
    expect(appShareUrl({ href: 'https://artignat2000.github.io/Math4Class/#/rewards' })).toBe(
      'https://artignat2000.github.io/Math4Class/',
    );
    expect(appShareUrl({ href: 'https://chislo.example.ru/app/index.html?x=1#/lesson' })).toBe(
      'https://chislo.example.ru/app/index.html',
    );
  });

  it('не отдаёт другу локальный адрес разработки', () => {
    for (const href of [
      'http://localhost:5173/',
      'http://localhost:4173/#/rewards',
      'http://127.0.0.1:3000/',
      'http://0.0.0.0:8080/',
      'http://[::1]:5173/',
    ]) {
      expect(appShareUrl({ href })).toBe(CANONICAL_APP_URL);
    }
  });

  it('на установленном приложении и файле ведёт на опубликованную сборку', () => {
    expect(appShareUrl({ href: 'capacitor://localhost/' })).toBe(CANONICAL_APP_URL);
    expect(appShareUrl({ href: 'file:///android_asset/index.html' })).toBe(CANONICAL_APP_URL);
    expect(appShareUrl({ href: '' })).toBe(CANONICAL_APP_URL);
    expect(appShareUrl(null)).toBe(CANONICAL_APP_URL);
  });
});

describe('диалог с QR-кодом', () => {
  it('показывает крупный код, ссылку и кнопку копирования', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    withClipboard(writeText);
    render(<ShareDialog onClose={vi.fn()} />);

    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('heading', { name: 'Покажите QR-код' })).toBeVisible();
    const qr = screen.getByRole('img', { name: /QR-код со ссылкой на приложение/ });
    expect(qr).toBeVisible();
    // Код действительно нарисован: есть модули, а не пустой каркас.
    expect(qr.querySelectorAll('path, rect').length).toBeGreaterThan(0);
    expect(screen.getByRole('textbox', { name: 'Ссылка на приложение' })).toHaveValue(
      CANONICAL_APP_URL,
    );

    await user.click(screen.getByRole('button', { name: /Скопировать ссылку/ }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(CANONICAL_APP_URL));
    expect(await screen.findByRole('status')).toHaveTextContent('Ссылка скопирована');
  });

  it('подсказывает, что делать, если скопировать не удалось', async () => {
    const user = userEvent.setup();
    withClipboard(vi.fn().mockRejectedValue(new Error('denied')));
    render(<ShareDialog onClose={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /Скопировать ссылку/ }));
    expect(await screen.findByRole('status')).toHaveTextContent('Выделите ссылку');
  });

  it('предлагает «Поделиться…» только там, где это поддерживает система', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<ShareDialog onClose={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /Поделиться…/ })).not.toBeInTheDocument();
    unmount();

    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { configurable: true, value: share });
    render(<ShareDialog onClose={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: /Поделиться…/ }));
    await waitFor(() =>
      expect(share).toHaveBeenCalledWith(
        expect.objectContaining({ url: CANONICAL_APP_URL, title: expect.any(String) }),
      ),
    );
    expect(await screen.findByRole('status')).toHaveTextContent('Спасибо, что делитесь');
  });

  it('закрывается по Esc и по кнопке', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { unmount } = render(<ShareDialog onClose={onClose} />);
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
    unmount();

    const second = vi.fn();
    render(<ShareDialog onClose={second} />);
    await user.click(screen.getByRole('button', { name: 'Закрыть' }));
    expect(second).toHaveBeenCalledTimes(1);
  });
});
