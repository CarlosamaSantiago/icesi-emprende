'use server';

import { revalidatePath } from 'next/cache';
import { type ActionResult, fromError, fromZod, ok } from '@/lib/action-result';
import { api } from '@/lib/api/client';
import type { Perfil } from '@/lib/api/types';
import { requireSession } from '@/lib/auth/session';
import { forwardImage } from '@/lib/upload-action';
import { type ProfileInput, profileSchema } from './schemas';

export async function updateProfileAction(input: ProfileInput): Promise<ActionResult<Perfil>> {
  await requireSession();
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  try {
    const perfil = await api<Perfil>('/usuarios/me', { method: 'PATCH', body: parsed.data });
    revalidatePath('/', 'layout'); // name appears in the topbar
    return ok(perfil, 'Perfil actualizado');
  } catch (e) {
    return fromError(e);
  }
}

/** HU-04: photo appears in the profile and the navigation after upload. */
export async function uploadProfilePhotoAction(fd: FormData): Promise<ActionResult<Perfil>> {
  await requireSession();
  const res = await forwardImage<Perfil>('/usuarios/me/foto', fd);
  if (res.ok) revalidatePath('/', 'layout');
  return res;
}
