import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.ts', 'src/**/*.test.js'],
    exclude: ['tests-e2e/**'],
  },
  resolve: {
    extensions: ['.ts', '.js', '.mjs', '.json'],
  },
});

