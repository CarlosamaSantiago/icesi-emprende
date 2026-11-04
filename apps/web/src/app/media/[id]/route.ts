import { env } from '@/lib/env';

/** Same-origin proxy for uploaded images (see lib/media.ts). Only UUID ids are accepted. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response('Not found', { status: 404 });

  const upstream = await fetch(new URL(`/api/archivos/${id}`, env.API_URL), { cache: 'no-store' }).catch(
    () => null,
  );
  if (!upstream?.ok || !upstream.body) return new Response('Not found', { status: 404 });

  return new Response(upstream.body, {
    headers: {
      'Content-Type': upstream.headers.get('Content-Type') ?? 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000, immutable', // ids are content-unique and never reused
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'",
    },
  });
}
