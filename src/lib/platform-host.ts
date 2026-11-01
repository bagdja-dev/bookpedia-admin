/**
 * Base domain untuk resolusi subdomain `{slug}.{PLATFORM_HOST}` di middleware.ts.
 * Sama dengan reader app (bookpedia-novelo) — decision 11 Sep 2026.
 */
export const PLATFORM_HOST = (() => {
  const v = process.env.NEXT_PUBLIC_PLATFORM_URL;
  if (!v) return 'bagdja.com';
  try {
    return new URL(v).hostname;
  } catch {
    return 'bagdja.com';
  }
})();

export const DEFAULT_PLATFORM_SLUG = process.env.NEXT_PUBLIC_DEFAULT_PLATFORM_SLUG ?? 'novello';
export const API_URL = process.env.NEXT_PUBLIC_BOOKPEDIA_API_URL ?? 'http://localhost:5020';
