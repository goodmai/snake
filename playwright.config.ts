import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests-e2e',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:4173',
    headless: true,
  },
  webServer: {
    command: 'yarn workspace frontend run -T dev --port 4173 --host 127.0.0.1 --strictPort',
    port: 4173,
    timeout: 60_000,
    reuseExistingServer: true,
  },
});
