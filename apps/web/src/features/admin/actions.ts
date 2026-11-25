'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { type ActionResult, fromError, fromZod, ok } from '@/lib/action-result';
import { api } from '@/lib/api/client';
import type {
  CategoriaAdmin,
  DelMesItem,
  EmprendimientoAdmin,
  EmprendimientoResumen,
  UsuarioAdmin,
} from '@/lib/api/types';
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

// ------------------------------------------------------------------ HU-43 aprobación
const decisionSchema = z
  .object({
    id: z.number().int().positive(),
    decision: z.enum(['APROBADO', 'RECHAZADO']),
    motivo: z.string().trim().max(500).optional(),
  })
  .refine((v) => v.decision === 'APROBADO' || (v.motivo?.length ?? 0) >= 5, {
    path: ['motivo'],
    message: 'Indica el motivo del rechazo (mínimo 5 caracteres)',
  });

export async function decideBusinessAction(
  input: z.infer<typeof decisionSchema>,
): Promise<ActionResult<EmprendimientoAdmin>> {
  await requireSession('ADMIN');
  const parsed = decisionSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  try {
    const e = await api<EmprendimientoAdmin>(`/admin/emprendimientos/${parsed.data.id}/decision`, {
      method: 'POST',
      body: { decision: parsed.data.decision, motivo: parsed.data.motivo },
    });
    refresh();
    return ok(e, parsed.data.decision === 'APROBADO' ? `${e.nombre} aprobado` : `${e.nombre} rechazado`);
  } catch (e) {
    return fromError(e);
  }
}

// ------------------------------------------------------------------ HU-26 / HU-27 usuarios y roles
const roleSchema = z.object({
  id: z.number().int().positive(),
  rol: z.enum(['ADMIN', 'EMPRENDEDOR', 'COMPRADOR']),
});

export async function assignRoleAction(
  input: z.infer<typeof roleSchema>,
): Promise<ActionResult<UsuarioAdmin>> {
  await requireSession('ADMIN');
  const parsed = roleSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  try {
    const u = await api<UsuarioAdmin>(`/admin/usuarios/${parsed.data.id}/roles`, {
      method: 'POST',
      body: { rol: parsed.data.rol },
    });
    revalidatePath('/admin/usuarios');
    return ok(u, `Rol ${parsed.data.rol} asignado a ${u.nombreCompleto}`);
  } catch (e) {
    return fromError(e);
  }
}

export async function revokeRoleAction(
  input: z.infer<typeof roleSchema>,
): Promise<ActionResult<UsuarioAdmin>> {
  await requireSession('ADMIN');
  const parsed = roleSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  try {
    const u = await api<UsuarioAdmin>(`/admin/usuarios/${parsed.data.id}/roles/${parsed.data.rol}`, {
      method: 'DELETE',
    });
    revalidatePath('/admin/usuarios');
    return ok(u, `Rol ${parsed.data.rol} retirado a ${u.nombreCompleto}`);
  } catch (e) {
    return fromError(e);
  }
}

export async function deleteUserAction(input: { id: number }): Promise<ActionResult> {
  await requireSession('ADMIN');
  const parsed = z.object({ id: z.number().int().positive() }).safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  try {
    await api(`/admin/usuarios/${parsed.data.id}`, { method: 'DELETE' });
    revalidatePath('/admin/usuarios');
    return ok(undefined, 'Usuario eliminado');
  } catch (e) {
    return fromError(e);
  }
}

// ------------------------------------------------------------------ HU-28 categorías
const categorySchema = z.object({
  id: z.number().int().positive().optional(),
  nombre: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  descripcion: z.string().trim().max(255).optional(),
});

export async function saveCategoryAction(
  input: z.infer<typeof categorySchema>,
): Promise<ActionResult<CategoriaAdmin>> {
  await requireSession('ADMIN');
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  const { id, ...body } = parsed.data;
  try {
    const c = await api<CategoriaAdmin>(id ? `/admin/categorias/${id}` : '/admin/categorias', {
      method: id ? 'PATCH' : 'POST',
      body,
    });
    revalidatePath('/admin/categorias');
    revalidatePath('/marketplace');
    return ok(c, id ? 'Categoría actualizada' : 'Categoría creada');
  } catch (e) {
    return fromError(e);
  }
}

export async function deleteCategoryAction(input: { id: number }): Promise<ActionResult> {
  await requireSession('ADMIN');
  const parsed = z.object({ id: z.number().int().positive() }).safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  try {
    await api(`/admin/categorias/${parsed.data.id}`, { method: 'DELETE' });
    revalidatePath('/admin/categorias');
    revalidatePath('/marketplace');
    return ok(undefined, 'Categoría eliminada');
  } catch (e) {
    return fromError(e);
  }
}

// ------------------------------------------------------------------ HU-46 Emprendimiento del Mes
const delMesSchema = z.object({
  emprendimientoId: z.number().int().positive(),
  periodo: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Formato AAAA-MM'),
});

export async function designateBusinessOfMonthAction(
  input: z.infer<typeof delMesSchema>,
): Promise<ActionResult<DelMesItem[]>> {
  await requireSession('ADMIN');
  const parsed = delMesSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  try {
    const list = await api<DelMesItem[]>('/admin/emprendimiento-del-mes', {
      method: 'POST',
      body: parsed.data,
    });
    revalidatePath('/admin/emprendimiento-del-mes');
    revalidatePath('/marketplace');
    return ok(list, 'Emprendimiento del Mes designado');
  } catch (e) {
    return fromError(e);
  }
}
