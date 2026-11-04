'use server';

import { redirect } from 'next/navigation';
import { type ActionResult, fromError, fromZod, ok } from '@/lib/action-result';
import { api } from '@/lib/api/client';
import type { AuthResponse } from '@/lib/api/types';
import { createSession, destroySession } from '@/lib/auth/session';
import { type LoginInput, loginSchema, type RegisterInput, registerSchema } from './schemas';

/** Only allow same-site relative redirects after login (prevents open-redirect). */
function safeNext(next: unknown) {
  return typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') ? next : '/marketplace';
}

export async function loginAction(input: LoginInput, next?: string): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  try {
    const res = await api<AuthResponse>('/auth/login', { method: 'POST', body: parsed.data, auth: false });
    await createSession(res.accessToken);
  } catch (e) {
    return fromError(e);
  }
  redirect(safeNext(next));
}

export async function registerAction(input: RegisterInput): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  try {
    await api<AuthResponse>('/auth/register', { method: 'POST', body: parsed.data, auth: false });
  } catch (e) {
    return fromError(e);
  }
  // HU-01 CA4: account created → tell the user how to sign in
  return ok(undefined, 'Cuenta creada. Ya puedes iniciar sesión con tu correo institucional.');
}

export async function logoutAction() {
  await destroySession();
  redirect('/login');
}
