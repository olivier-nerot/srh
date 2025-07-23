import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema/*',
  out: './src/db/migrations',
  dialect: 'turso',
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL ?? (() => { throw new Error('TURSO_DATABASE_URL manquant'); })(),
    authToken: process.env.TURSO_AUTH_TOKEN ?? (() => { throw new Error('TURSO_AUTH_TOKEN manquant'); })(),
  },
});