import { defineConfig } from 'vitest/config';

// Unit and HTTP tests. None of them needs a database: the HTTP tests only reach
// routes that answer before any query (auth, validation, errors, health).
// The end-to-end suite in ui/ covers the API against a real Postgres.
export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    env: {
      JWT_SECRET: 'test-secret-that-is-at-least-32-characters-long',
      LOG_LEVEL: 'silent',
    },
  },
});
