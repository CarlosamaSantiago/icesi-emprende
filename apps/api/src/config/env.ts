/** Validates required environment variables at boot — fail fast instead of at first request. */
export interface Env {
  NODE_ENV: string;
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
}

export function validateEnv(raw: Record<string, string | undefined>): Env {
  const missing = ['DATABASE_URL', 'JWT_SECRET'].filter((k) => !raw[k]);
  if (missing.length) throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  if (raw.JWT_SECRET!.length < 32) throw new Error('JWT_SECRET must be at least 32 characters');

  return {
    NODE_ENV: raw.NODE_ENV ?? 'development',
    PORT: Number(raw.PORT ?? 3001),
    DATABASE_URL: raw.DATABASE_URL!,
    JWT_SECRET: raw.JWT_SECRET!,
    JWT_EXPIRES_IN: raw.JWT_EXPIRES_IN ?? '8h',
  };
}
