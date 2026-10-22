import { defineConfig } from 'drizzle-kit'

// Reads DATABASE_URL from the shell or .env (drizzle-kit loads .env itself).
export default defineConfig({
  schema: './src/server/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL ?? '' },
  strict: true,
  verbose: true,
})
