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
const port = Number(process.env.PLAYWRIGHT_PORT ?? 4173);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PLAYWRIGHT_PORT');
const baseURL = `http://127.0.0.1:${port}`;
export default defineConfig({
  testDir: './tests/e2e',
  // Split tests, not whole files, between isolated CI shards. Each shard still
  // uses one worker to keep Chromium stable in the sandbox.
  fullyParallel: true,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 45_000,
  use: {
    baseURL,
    viewport: { width: 1440, height: 1000 },
    headless: true,
    reducedMotion: 'reduce',
    screenshot: 'only-on-failure',
    launchOptions: {
      executablePath: await chromium.executablePath(),
      // The bundled Chromium spins the browser process at ~200 % CPU after a
      // long mouse-drag test when the GPU thread runs in-process through
      // swiftshader; the next browser.newContext() then never answers. These
      // tests draw SVG and CSS only, so software rendering without a GPU thread
      // is enough and keeps the whole suite stable.
      args: [
        ...chromium.args.filter(
          (arg) =>
            !['--single-process', '--in-process-gpu', '--ignore-gpu-blocklist'].includes(arg) &&
            !arg.startsWith('--use-gl') &&
            !arg.startsWith('--use-angle') &&
            !arg.startsWith('--enable-unsafe-swiftshader'),
        ),
        '--disable-gpu',
      ],
    },
  },
  webServer: {
    command: `npm run preview -- --port ${port} --strictPort`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
});
