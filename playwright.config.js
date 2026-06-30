import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  timeout: 15000,
  reporter: 'list',
  use: {
    headless: true,
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
})
