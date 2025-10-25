import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60000,
  expect: {
    timeout: 5000,
  },
  reporter: [['list']],
  use: {
    trace: 'retain-on-failure',
    baseURL: 'http://127.0.0.1:4173',
  },
  webServer: {
    command: 'npm run preview',
    port: 4173,
    timeout: 60000,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: 'chromium-ui',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
      },
    },
  ],
});
