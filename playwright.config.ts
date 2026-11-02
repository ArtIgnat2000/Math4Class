import { defineConfig } from '@playwright/test';
import chromium, { inflate } from '@sparticuz/chromium';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// The npm package carries Chromium, so CI does not need a separate browser download.
await inflate(
  fileURLToPath(new URL('../bin/al2023.tar.br', import.meta.resolve('@sparticuz/chromium'))),
);
process.env.LD_LIBRARY_PATH = `${join(tmpdir(), 'al2023', 'lib')}:${process.env.LD_LIBRARY_PATH ?? ''}`;
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 45_000,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    viewport: { width: 1440, height: 1000 },
    headless: true,
    reducedMotion: 'reduce',
    screenshot: 'only-on-failure',
    launchOptions: {
      executablePath: await chromium.executablePath(),
      args: chromium.args.filter((arg) => arg !== '--single-process'),
    },
  },
  webServer: {
    command: 'npm run preview -- --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
  },
});
