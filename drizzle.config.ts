import type { Config } from 'drizzle-kit';
import 'dotenv/config';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

// 환경별 접근
// Development/Production 모두 Neon을 사용
console.log('Using DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 50) + '...');

export default {
  schema: './db/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
