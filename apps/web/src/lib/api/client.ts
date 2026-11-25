import 'server-only';
import { redirect } from 'next/navigation';
import { getSessionToken } from '@/lib/auth/session';
import { env } from '@/lib/env';

/** Error raised for any non-2xx API response. `message` is safe to show to users. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details: string[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  /** JSON body (mutually exclusive with formData). */
  body?: unknown;
  formData?: FormData;
  /** Send the session token (default true). Public endpoints still work without a session. */
  auth?: boolean;
  /** Query string params; undefined/empty values are skipped. */
  query?: Record<string, string | number | undefined>;
}

/**
 * Typed server-to-server call to the Nest API. The only place in the web app that talks HTTP to the API.
 * Always `no-store`: data is per-user and must never be cached across users.
 */
export async function api<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, formData, auth = true, query } = opts;
  const url = new URL(`/api${path}`, env.API_URL);
  for (const [k, v] of Object.entries(query ?? {})) {
    if (v !== undefined && v !== '') url.searchParams.set(k, String(v));
  }

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = auth ? await getSessionToken() : undefined;
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: formData ?? (body !== undefined ? JSON.stringify(body) : undefined),
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new ApiError(503, 'No pudimos conectar con el servidor. Intenta de nuevo en unos segundos.');
  }

  if (res.status === 401 && token) redirect('/login?expired=1');
  if (res.status === 204) return undefined as T;

  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const raw = (data as { message?: string | string[] } | null)?.message;
    const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
    throw new ApiError(res.status, list[0] ?? 'Ocurrió un error inesperado', list);
  }
  return data as T;
}

/** For pages: turn a 404 from the API into Next's notFound(). */
export function isNotFound(e: unknown) {
  return e instanceof ApiError && (e.status === 404 || e.status === 403);
}

/** Raw GET for binary downloads (PDF/CSV). Returns the upstream Response untouched; callers stream it back. */
export async function apiRaw(path: string, query?: Record<string, string | number | undefined>) {
  const url = new URL(`/api${path}`, env.API_URL);
  for (const [k, v] of Object.entries(query ?? {})) {
    if (v !== undefined && v !== '') url.searchParams.set(k, String(v));
  }
  const token = await getSessionToken();
  return fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: 'no-store',
    signal: AbortSignal.timeout(30_000),
  });
}
