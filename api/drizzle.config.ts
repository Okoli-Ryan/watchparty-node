import { defineConfig } from 'drizzle-kit';

// `npm run db:generate` compares src/db/schema.ts with the last migration and
// writes the SQL for the difference into drizzle/.
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/watchparty',
  },
});
