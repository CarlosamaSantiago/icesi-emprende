import { NextResponse } from 'next/server';
import { ApiError, api } from '@/lib/api/client';
import type { NotificacionesResponse } from '@/lib/api/types';
import { getSession } from '@/lib/auth/session';

/** HU-41/42: polled by the notification bell. Same-origin BFF endpoint — the API token stays in the httpOnly cookie. */
export async function GET() {
  if (!(await getSession())) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
  try {
    const data = await api<NotificacionesResponse>('/notificaciones');
    return NextResponse.json(data, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (e) {
    const status = e instanceof ApiError ? e.status : 502;
    return NextResponse.json({ message: 'No se pudieron cargar las notificaciones' }, { status });
  }
}
