import { jwtVerify } from 'jose';
import type { SessionUser } from '@/lib/api/types';

/** Edge-safe JWT verification (used by middleware and the session helpers). */
export const SESSION_COOKIE = 'ei_session';

export async function verifySessionToken(
  token: string | undefined,
  secret: string,
): Promise<SessionUser | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), { algorithms: ['HS256'] });
    return {
      id: Number(payload.sub),
      email: String(payload.email),
      nombre: String(payload.nombre),
      roles: Array.isArray(payload.roles) ? (payload.roles as SessionUser['roles']) : [],
    };
  } catch {
    return null;
  }
}
