import { type NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth/jwt';

/** Routes that require a valid session (HU-02 CA3). Role checks happen in the page and, authoritatively, in the API. */
const PROTECTED = ['/perfil', '/carrito', '/mi-negocio', '/mis-compras', '/pedidos-recibidos', '/admin'];
const AUTH_PAGES = ['/login', '/registro'];

function buildCsp(nonce: string, dev: boolean, https: boolean) {
  return [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ''}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob: https://images.unsplash.com`,
    `font-src 'self'`,
    `connect-src 'self'${dev ? ' ws:' : ''}`,
    `frame-ancestors 'none'`,
    `form-action 'self'`,
    `base-uri 'self'`,
    `object-src 'none'`,
    ...(https ? ['upgrade-insecure-requests'] : []),
  ].join('; ');
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const user = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value, process.env.JWT_SECRET ?? '');

  if (!user && PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    const url = new URL('/login', req.url);
    url.searchParams.set('next', pathname + search);
    const res = NextResponse.redirect(url);
    res.cookies.delete(SESSION_COOKIE); // drop expired/invalid cookies
    return res;
  }
  if (user && AUTH_PAGES.includes(pathname)) {
    return NextResponse.redirect(new URL('/marketplace', req.url));
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const csp = buildCsp(nonce, process.env.NODE_ENV !== 'production', req.nextUrl.protocol === 'https:');
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.headers.set('Content-Security-Policy', csp);
  return res;
}

export const config = {
  matcher: [{ source: '/((?!_next/static|_next/image|favicon.ico|media/).*)' }],
};
