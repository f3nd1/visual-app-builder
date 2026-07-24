import { defineConfig } from '@playwright/test'

// Uses the Chromium pre-installed in this environment rather than downloading
// one (PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1). executablePath pins the exact
// binary so the @playwright/test version need not match a downloaded browser.
const CHROMIUM =
  process.env.PW_CHROMIUM ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: 'http://localhost:5173',
    launchOptions: { executablePath: CHROMIUM },
  },
  webServer: {
    command: 'npm run dev -- --port 5173 --strictPort',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 60000,
  },
})
