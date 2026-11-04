/**
 * Applies pending SQL migrations, then seeds demo data if the database is empty.
 * Runs on every deploy (Railway pre-deploy) — idempotent.
 *   npm run db:migrate
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';

const here = dirname(fileURLToPath(import.meta.url));
const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');

const pool = new pg.Pool({ connectionString: url });
const db = drizzle(pool);

await migrate(db, { migrationsFolder: join(here, 'migrations') });
console.log('✔ migrations applied');

const { rows } = await pool.query<{ n: number }>('SELECT count(*)::int AS n FROM estado');
if (rows[0].n === 0 || process.argv.includes('--force-seed')) {
  await pool.query(readFileSync(join(here, 'seed.sql'), 'utf8'));
  console.log('✔ demo data seeded (all users: password 1234)');
} else {
  console.log('• data already present, seed skipped');
}
await pool.end();
