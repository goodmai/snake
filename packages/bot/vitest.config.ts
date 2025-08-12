import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      all: true,
      lines: 95,
      statements: 95,
      functions: 95,
      branches: 90,
      include: ['src/**/*.ts'],
      exclude: ['src/tests/**', '**/*.test.*']
    }
  },
});

