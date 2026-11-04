'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { type ActionResult, fromError, fromZod, ok } from '@/lib/action-result';
import { api } from '@/lib/api/client';
import type { EmprendimientoResumen } from '@/lib/api/types';
import { requireSession } from '@/lib/auth/session';

const visibilitySchema = z.object({
  id: z.number().int().positive(),
  estado: z.enum(['ACTIVO', 'INACTIVO']),
});
const featuredSchema = z.object({ id: z.number().int().positive(), destacado: z.boolean() });

const refresh = () => {
  revalidatePath('/admin/emprendimientos');
  revalidatePath('/marketplace');
};

/** HU-09 */
export async function setBusinessVisibilityAction(
  input: z.infer<typeof visibilitySchema>,
): Promise<ActionResult<EmprendimientoResumen>> {
  await requireSession('ADMIN');
  const parsed = visibilitySchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  try {
    const e = await api<EmprendimientoResumen>(`/admin/emprendimientos/${parsed.data.id}/estado`, {
      method: 'PATCH',
      body: { estado: parsed.data.estado },
    });
    refresh();
    return ok(e, parsed.data.estado === 'ACTIVO' ? `${e.nombre} activado` : `${e.nombre} desactivado`);
  } catch (e) {
    return fromError(e);
  }
}

/** HU-10 */
export async function setBusinessFeaturedAction(
  input: z.infer<typeof featuredSchema>,
): Promise<ActionResult<EmprendimientoResumen>> {
  await requireSession('ADMIN');
  const parsed = featuredSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  try {
    const e = await api<EmprendimientoResumen>(`/admin/emprendimientos/${parsed.data.id}/destacado`, {
      method: 'PATCH',
      body: { destacado: parsed.data.destacado },
    });
    refresh();
    return ok(
      e,
      parsed.data.destacado ? `${e.nombre} marcado como destacado` : `${e.nombre} ya no es destacado`,
    );
  } catch (e) {
    return fromError(e);
  }
}
