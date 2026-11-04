import type { NextConfig } from 'next';

/** Static security headers. The CSP is per-request (nonce) and set in src/middleware.ts. */
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: {
    // Image uploads go through Server Actions (API enforces 2 MB; small margin for multipart overhead)
    serverActions: { bodySizeLimit: '3mb' },
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  async redirects() {
    return [{ source: '/', destination: '/marketplace', permanent: false }];
  },
};

export default nextConfig;
