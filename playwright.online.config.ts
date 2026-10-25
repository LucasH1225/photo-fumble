import { defineConfig } from '@playwright/test';

// Explicit opt-in: these tests create retained rooms and upload synthetic game media.
if (process.env.ONLINE_ROOM_TESTS !== '1' || !process.env.ONLINE_ROOM_TEST_URL)
  throw new Error(
    'Set ONLINE_ROOM_TESTS=1 and ONLINE_ROOM_TEST_URL to intentionally test a hosted site.',
  );
const target = new URL(process.env.ONLINE_ROOM_TEST_URL);
if (
  target.protocol !== 'https:' ||
  target.username ||
  target.password ||
  target.pathname !== '/' ||
  target.search ||
  target.hash
)
  throw new Error('ONLINE_ROOM_TEST_URL must be a bare HTTPS origin without credentials.');
export default defineConfig({
  testDir: './tests/browser',
  testMatch: ['game.spec.ts', 'rooms.spec.ts'],
  timeout: 600_000,
  workers: 1,
  fullyParallel: false,
  reporter: 'list',
  outputDir: 'output/playwright/online-room-test-results',
  use: {
    baseURL: target.origin,
    actionTimeout: 30_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
});
