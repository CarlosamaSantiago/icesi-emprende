'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { type ActionResult, fromError, fromZod, ok } from '@/lib/action-result';
import { api } from '@/lib/api/client';
import type { EmprendimientoResumen, ProductoDetalle, ProductoResumen } from '@/lib/api/types';
import { requireSession } from '@/lib/auth/session';
import { forwardImage } from '@/lib/upload-action';
import {
  type BusinessInput,
  businessSchema,
  type ProductInput,
  productSchema,
  productStatusSchema,
} from './schemas';

const id = z.number().int().positive();
const guard = () => requireSession('EMPRENDEDOR', 'ADMIN');

// ------------------------------------------------------------------ businesses
export async function createBusinessAction(
  input: BusinessInput,
): Promise<ActionResult<EmprendimientoResumen>> {
  await guard();
  const parsed = businessSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  try {
    const e = await api<EmprendimientoResumen>('/mi-negocio/emprendimientos', {
      method: 'POST',
      body: parsed.data,
    });
    revalidatePath('/mi-negocio');
    return ok(e, 'Emprendimiento creado. Quedará visible cuando el CIEI lo active.');
  } catch (e) {
    return fromError(e);
  }
}

export async function updateBusinessAction(
  businessId: number,
  input: BusinessInput,
): Promise<ActionResult<EmprendimientoResumen>> {
  await guard();
  if (!id.safeParse(businessId).success) return { ok: false, error: 'Emprendimiento inválido' };
  const parsed = businessSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  try {
    const e = await api<EmprendimientoResumen>(`/mi-negocio/emprendimientos/${businessId}`, {
      method: 'PATCH',
      body: parsed.data,
    });
    revalidatePath('/mi-negocio', 'layout');
    revalidatePath(`/emprendimientos/${businessId}`);
    return ok(e, 'Cambios guardados');
  } catch (e) {
    return fromError(e);
  }
}

export async function uploadLogoAction(
  businessId: number,
  fd: FormData,
): Promise<ActionResult<EmprendimientoResumen>> {
  await guard();
  if (!id.safeParse(businessId).success) return { ok: false, error: 'Emprendimiento inválido' };
  const res = await forwardImage<EmprendimientoResumen>(`/mi-negocio/emprendimientos/${businessId}/logo`, fd);
  if (res.ok) revalidatePath('/mi-negocio', 'layout');
  return res;
}

// ------------------------------------------------------------------ products
export async function createProductAction(
  businessId: number,
  input: ProductInput,
): Promise<ActionResult<ProductoResumen>> {
  await guard();
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  if (!id.safeParse(businessId).success) return { ok: false, error: 'Emprendimiento inválido' };
  try {
    const p = await api<ProductoResumen>(`/mi-negocio/emprendimientos/${businessId}/productos`, {
      method: 'POST',
      body: parsed.data,
    });
    revalidatePath(`/mi-negocio/${businessId}/productos`);
    return ok(p, 'Producto creado');
  } catch (e) {
    return fromError(e);
  }
}

export async function updateProductAction(
  productId: number,
  input: ProductInput,
): Promise<ActionResult<ProductoDetalle>> {
  await guard();
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  if (!id.safeParse(productId).success) return { ok: false, error: 'Producto inválido' };
  try {
    const p = await api<ProductoDetalle>(`/mi-negocio/productos/${productId}`, {
      method: 'PATCH',
      body: parsed.data,
    });
    revalidatePath('/mi-negocio', 'layout');
    revalidatePath(`/productos/${productId}`);
    return ok(p, 'Producto actualizado');
  } catch (e) {
    return fromError(e);
  }
}

/** HU-13: deactivate without deleting. */
export async function setProductStatusAction(
  input: z.infer<typeof productStatusSchema>,
): Promise<ActionResult<ProductoResumen>> {
  await guard();
  const parsed = productStatusSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  try {
    const p = await api<ProductoResumen>(`/mi-negocio/productos/${parsed.data.productoId}/estado`, {
      method: 'PATCH',
      body: { estado: parsed.data.estado },
    });
    revalidatePath('/mi-negocio', 'layout');
    return ok(p, parsed.data.estado === 'ACTIVO' ? 'Producto activado' : 'Producto desactivado');
  } catch (e) {
    return fromError(e);
  }
}

/** HU-14 */
export async function addProductImageAction(
  productId: number,
  fd: FormData,
): Promise<ActionResult<ProductoDetalle>> {
  await guard();
  if (!id.safeParse(productId).success) return { ok: false, error: 'Producto inválido' };
  const res = await forwardImage<ProductoDetalle>(`/mi-negocio/productos/${productId}/imagenes`, fd, 'POST');
  if (res.ok) revalidatePath(`/mi-negocio/productos/${productId}`);
  return res;
}

export async function deleteProductImageAction(
  productId: number,
  imageId: number,
): Promise<ActionResult<ProductoDetalle>> {
  await guard();
  if (!id.safeParse(productId).success || !id.safeParse(imageId).success)
    return { ok: false, error: 'Imagen inválida' };
  try {
    const p = await api<ProductoDetalle>(`/mi-negocio/productos/${productId}/imagenes/${imageId}`, {
      method: 'DELETE',
    });
    revalidatePath(`/mi-negocio/productos/${productId}`);
    return ok(p, 'Imagen eliminada');
  } catch (e) {
    return fromError(e);
  }
}
