import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['src/test/setup.ts'],
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.ts', 'src/**/*.test.js'],
    exclude: ['tests-e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      all: true,
      lines: 95,
      statements: 95,
      functions: 95,
      branches: 90,
      include: ['src/**/*.ts', 'src/**/*.tsx', 'src/**/*.js'],
      exclude: ['tests-e2e/**', '**/*.test.*']
    }
  },
  resolve: {
    extensions: ['.ts', '.js', '.mjs', '.json'],
  },
});

