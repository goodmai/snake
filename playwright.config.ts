import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'packages/frontend/tests-e2e',
  timeout: 30_000,
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
    video: 'off',
    headless: true,
  },
  webServer: {
    command: 'yarn workspace frontend dev -- --port 5173 --host 127.0.0.1 --strictPort',
    port: 5173,
    timeout: 60_000,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  reporter: [['list']],
});
