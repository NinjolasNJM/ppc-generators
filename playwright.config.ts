import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/generators',
  testMatch: '**/*.spec.ts',
  updateSnapshots: 'none',
  reporter: [['list'], ['html', { open: 'on-failure' }]],
  expect: {
    toHaveScreenshot: {
      threshold: 0,
      pathTemplate:
        '{testDir}/{testFileDir}/snapshots/{arg}-{projectName}-{platform}{ext}',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        baseURL: 'http://127.0.0.1:3000',
        viewport: { width: 1600, height: 1400 },
      },
    },
  ],
  webServer: {
    command: 'npm run dev -- --hostname 127.0.0.1',
    reuseExistingServer: false,
    timeout: 120000,
    url: 'http://127.0.0.1:3000',
  },
});
