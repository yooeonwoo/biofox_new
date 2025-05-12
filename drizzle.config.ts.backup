import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

// DATABASE_URL 형식: postgres://postgres:postgres@db.lgzzqoaiukuywmenxzay.supabase.co:5432/postgres
const url = new URL(process.env.DATABASE_URL);
const [username, password] = url.username && url.password ? [url.username, url.password] : [];
const host = url.hostname;
const port = url.port ? parseInt(url.port, 10) : 5432;
const database = url.pathname.substring(1); // pathname은 '/postgres'와 같은 형태로 시작함

export default {
  schema: './db/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    host,
    port,
    user: username,
    password,
    database,
    ssl: true,
  },
  verbose: true,
  strict: true,
} satisfies Config; 