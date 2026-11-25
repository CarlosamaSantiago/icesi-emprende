import { type NextRequest, NextResponse } from 'next/server';
import { apiRaw } from '@/lib/api/client';
import { getSession } from '@/lib/auth/session';

const FORMATS = new Set(['pdf', 'csv']);

/** HU-33 / HU-34: streams the API's PDF/CSV through the BFF (the browser never sees the API token). */
export async function GET(req: NextRequest, { params }: { params: Promise<{ formato: string }> }) {
  const { formato } = await params;
  if (!FORMATS.has(formato)) return new NextResponse('No encontrado', { status: 404 });
  const user = await getSession();
  if (!user) return NextResponse.redirect(new URL('/login', req.url));
  if (!user.roles.some((r) => r === 'EMPRENDEDOR' || r === 'ADMIN'))
    return new NextResponse('Prohibido', { status: 403 });

  const sp = req.nextUrl.searchParams;
  const upstream = await apiRaw(`/metricas/${formato}`, {
    desde: sp.get('desde') ?? undefined,
    hasta: sp.get('hasta') ?? undefined,
    emprendimientoId: sp.get('emprendimientoId') ?? undefined,
  });
  if (!upstream.ok) {
    const body = (await upstream.json().catch(() => null)) as { message?: string | string[] } | null;
    const msg = Array.isArray(body?.message)
      ? body.message[0]
      : (body?.message ?? 'No se pudo generar el archivo');
    return new NextResponse(msg, { status: upstream.status });
  }
  return new NextResponse(upstream.body, {
    headers: {
      'Content-Type': upstream.headers.get('content-type') ?? 'application/octet-stream',
      'Content-Disposition':
        upstream.headers.get('content-disposition') ?? `attachment; filename="metricas.${formato}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
