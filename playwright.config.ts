import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests-e2e',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:4173',
    headless: true,
  },
  webServer: {
    command: 'yarn workspace frontend build && yarn workspace frontend preview --port 4173',
    port: 4173,
    timeout: 60_000,
    reuseExistingServer: true,
  },
});
