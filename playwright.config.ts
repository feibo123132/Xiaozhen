import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e', fullyParallel: false, workers: 1, timeout: 30_000,
  use: { baseURL: 'http://127.0.0.1:3187', trace: 'retain-on-failure' },
  webServer: { command: 'npm run dev -- --hostname 127.0.0.1 --port 3187', url: 'http://127.0.0.1:3187', reuseExistingServer: false, timeout: 120_000, env: { DATABASE_URL: 'file:./prisma/e2e.db', ADMIN_BOOTSTRAP_PASSWORD: 'e2e-curator-password' } },
  projects: [
    { name: 'mobile', use: { ...devices['Pixel 5'] } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } } },
  ],
});
