import { defineConfig } from '@playwright/test';
import path from 'node:path';
import { tmpdir } from 'node:os';
const data = path.join(tmpdir(), `photo-fumble-e2e-${Date.now()}`);
export default defineConfig({
  testDir: './tests/browser',
  timeout: 180_000,
  workers: 1,
  fullyParallel: false,
  reporter: 'list',
  outputDir: 'output/playwright/test-results',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    actionTimeout: 10_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'NODE_ENV=production npm run build && node dist/server/server/index.js',
    url: 'http://127.0.0.1:4173/api/health',
    timeout: 60_000,
    reuseExistingServer: false,
    env: {
      NODE_ENV: 'test',
      PORT: '4173',
      APP_ORIGIN: 'http://127.0.0.1:4173',
      LOCAL_DATA_DIR: data,
      SESSION_NAMESPACE: 'test',
      SUPABASE_URL: '',
      SUPABASE_SECRET_KEY: '',
      SESSION_SECRET: 'playwright-test-only-secret-32-characters',
    },
  },
});
