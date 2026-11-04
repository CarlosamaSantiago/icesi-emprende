import 'server-only';
import { type ActionResult, fromError, ok } from '@/lib/action-result';
import { api } from '@/lib/api/client';
import { validateImageFile } from '@/lib/upload';

/** Shared server-side helper: validate the FormData file and forward it to an API upload endpoint. */
export async function forwardImage<T>(
  path: string,
  fd: FormData,
  method: 'PUT' | 'POST' = 'PUT',
): Promise<ActionResult<T>> {
  const file = fd.get('archivo');
  if (!(file instanceof File)) return { ok: false, error: 'Selecciona una imagen' };
  const err = validateImageFile(file);
  if (err) return { ok: false, error: err };

  const body = new FormData();
  body.set('archivo', file, file.name.replace(/[^\w.-]/g, '_').slice(0, 100));
  try {
    return ok(await api<T>(path, { method, formData: body }), 'Imagen guardada');
  } catch (e) {
    return fromError(e);
  }
}
