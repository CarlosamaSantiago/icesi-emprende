'use server';

import { z } from 'zod';
import { type ActionResult, fromError, fromZod, ok } from '@/lib/action-result';
import { api } from '@/lib/api/client';
import { requireSession } from '@/lib/auth/session';

/** HU-42: mark one notification as read. Returns the new unread count. */
export async function markReadAction(input: { id: number }): Promise<ActionResult<{ noLeidas: number }>> {
  await requireSession();
  const parsed = z.object({ id: z.number().int().positive() }).safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  try {
    return ok(
      await api<{ noLeidas: number }>(`/notificaciones/${parsed.data.id}/leida`, { method: 'PATCH' }),
    );
  } catch (e) {
    return fromError(e);
  }
}

export async function markAllReadAction(): Promise<ActionResult<{ noLeidas: number }>> {
  await requireSession();
  try {
    return ok(await api<{ noLeidas: number }>('/notificaciones/leer-todas', { method: 'POST' }));
  } catch (e) {
    return fromError(e);
  }
}
