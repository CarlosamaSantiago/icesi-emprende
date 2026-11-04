import 'server-only';
import { z } from 'zod';

/**
 * Server-side environment, validated once at boot. Never import from a client component
 * (the `server-only` import makes that a build error).
 */
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  /** Base URL of the Nest API, e.g. https://emprende-api.up.railway.app */
  API_URL: z.url(),
  /** Same secret the API signs JWTs with — used only to verify the session cookie. */
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
});

export const env = schema.parse(process.env);
export const isProd = env.NODE_ENV === 'production';
