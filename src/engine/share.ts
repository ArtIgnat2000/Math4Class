/**
 * Ссылка на приложение, которой делятся с другом.
 *
 * QR-код должен вести на опубликованную сборку: на localhost, в режиме разработки
 * или внутри установленного приложения адрес «своего» браузера бесполезен для друга.
 * Поэтому локальные и нестандартные адреса заменяются публичным.
 */
export const CANONICAL_APP_URL = 'https://artignat2000.github.io/Math4Class/';

/** Адреса, которые видит только автор: по ним друг приложение не откроет. */
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '[::1]']);

type LocationLike = {
  href?: string;
  origin?: string;
  pathname?: string;
};

/**
 * Возвращает адрес приложения без хеша маршрута: друг попадает на главный экран,
 * а не на случайную страницу.
 */
export function appShareUrl(location?: LocationLike | null): string {
  const source =
    location === undefined ? (typeof window === 'undefined' ? null : window.location) : location;
  if (!source) return CANONICAL_APP_URL;
  let url: URL;
  try {
    url = new URL(source.href ?? `${source.origin ?? ''}${source.pathname ?? ''}`);
  } catch {
    return CANONICAL_APP_URL;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return CANONICAL_APP_URL;
  if (LOCAL_HOSTS.has(url.hostname)) return CANONICAL_APP_URL;
  return `${url.origin}${url.pathname}`;
}
