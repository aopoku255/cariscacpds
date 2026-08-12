/**
 * Absolute URL for a file the API serves.
 *
 * Banners are public, so the browser fetches them straight from the API and
 * needs the browser-visible base — not the server-side one, which may be an
 * internal address.
 */
const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export function assetUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${BASE}${path}`;
}
