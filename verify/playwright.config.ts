import { defineConfig } from '@playwright/test'
import { repoRoot, DECK_ENTRY, CANVAS } from './helpers'

const PORT = Number(process.env.VERIFY_PORT ?? 3030)

const baseURL = `http://localhost:${PORT}`
const webServer = {
  command: `npx slidev ${DECK_ENTRY} --port ${PORT}`,
  cwd: repoRoot,
  url: baseURL,
  reuseExistingServer: !process.env.CI,
  timeout: 120_000,
}

export default defineConfig({
  testDir: '.',
  fullyParallel: false, // one shared dev server + sequential slide navigation
  workers: 1,
  forbidOnly: !!process.env.CI,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  timeout: 60_000,
  outputDir: './test-results',
  use: {
    baseURL,
    headless: true,
    viewport: { width: CANVAS.width + 10, height: CANVAS.height + 5 },
    contextOptions: { reducedMotion: 'reduce' },
  },
  webServer: process.env.VERIFY_SOURCE_ONLY ? undefined : webServer,
})
