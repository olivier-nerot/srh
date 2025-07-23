import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema/*',
  out: './src/db/migrations',
  dialect: 'turso',
  dbCredentials: {
    url: process.env.VITE_TURSO_DATABASE_URL ?? (() => { throw new Error('VITE_TURSO_DATABASE_URL manquant'); })(),
    authToken: process.env.VITE_TURSO_AUTH_TOKEN ?? (() => { throw new Error('VITE_TURSO_AUTH_TOKEN manquant'); })(),
  },
});