import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import type { Role, SessionUser } from '@/lib/api/types';
import { env, isProd } from '@/lib/env';
import { SESSION_COOKIE, verifySessionToken } from './jwt';

const MAX_AGE_SECONDS = 60 * 60 * 8; // keep in sync with API JWT_EXPIRES_IN

/** Store the API token in an httpOnly cookie — JavaScript in the browser can never read it. */
export async function createSession(token: string) {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function getSessionToken() {
  return (await cookies()).get(SESSION_COOKIE)?.value;
}

/** Current user from a *verified* token, memoized per request. Null when logged out/expired. */
export const getSession = cache(async (): Promise<SessionUser | null> => {
  return verifySessionToken(await getSessionToken(), env.JWT_SECRET);
});

/** Use at the top of protected pages/actions. Redirects to login when there is no session. */
export async function requireSession(...roles: Role[]): Promise<SessionUser> {
  const user = await getSession();
  if (!user) redirect('/login');
  if (roles.length && !user.roles.some((r) => roles.includes(r))) redirect('/marketplace');
  return user;
}

export const hasRole = (user: SessionUser | null, ...roles: Role[]) =>
  !!user && user.roles.some((r) => roles.includes(r));
