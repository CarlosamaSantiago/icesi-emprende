import 'server-only';
import type { z } from 'zod';
import { ApiError } from '@/lib/api/client';

/**
 * Uniform return type for every Server Action.
 * Actions never throw to the client: expected failures come back as `{ ok: false }`.
 */
export type ActionResult<T = void> =
  | { ok: true; data: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export const ok = <T>(data: T, message?: string): ActionResult<T> => ({ ok: true, data, message });

export function fromZod(error: z.ZodError): ActionResult<never> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.');
    fieldErrors[key] ??= issue.message;
  }
  return { ok: false, error: 'Revisa los campos marcados', fieldErrors };
}

/** Map any thrown error to a safe, user-facing ActionResult. Re-throws Next redirects. */
export function fromError(e: unknown): ActionResult<never> {
  if (e instanceof ApiError) return { ok: false, error: e.message };
  // Next.js uses thrown errors for redirect()/notFound(): let them propagate.
  if (e && typeof e === 'object' && 'digest' in e) throw e;
  console.error(e);
  return { ok: false, error: 'Ocurrió un error inesperado. Intenta de nuevo.' };
}
