/**
 * Uploaded files live in the API (`/api/archivos/:id`) and are served to the browser
 * through the same-origin proxy `/media/:id`, so the API host never needs to be exposed
 * and the CSP can stay `img-src 'self'`.
 */
export function mediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = url.match(/^\/api\/archivos\/([\w-]+)$/);
  return m ? `/media/${m[1]}` : url;
}
