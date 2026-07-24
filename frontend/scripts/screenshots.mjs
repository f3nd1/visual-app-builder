// Capture screenshots of the Studio and Runtime against the dev server.
// Run:  node scripts/screenshots.mjs   (dev server must be running on $BASE)
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const BASE = process.env.BASE || 'http://localhost:5178'
const CHROMIUM = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'screenshots')
mkdirSync(outDir, { recursive: true })

const shot = async (page, name) => {
  await page.screenshot({ path: join(outDir, name), fullPage: true })
  console.log('  saved', name)
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await chromium.launch({ executablePath: CHROMIUM })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

// ---------- Studio ----------
console.log('Studio…')
await page.goto(`${BASE}/index.html`, { waitUntil: 'networkidle' })
await page.click('[data-testid="load-example"]')
await sleep(300)
await page.click('[data-testid="tab-application"]'); await sleep(200); await shot(page, '01-studio-application.png')
await page.click('[data-testid="tab-data_model"]'); await sleep(200); await shot(page, '02-studio-data-model.png')
await page.click('[data-testid="tab-pages"]'); await sleep(300); await shot(page, '03-studio-pages.png')
await page.click('[data-testid="tab-workflow"]'); await sleep(900); await shot(page, '04-studio-workflow.png')
// populate one automation so the editor isn't empty
await page.click('[data-testid="tab-automations"]'); await sleep(200)
await page.click('text=+ Automation'); await sleep(200)
await page.click('text=+ condition').catch(() => {}); await sleep(200)
await shot(page, '05-studio-automations.png')
await page.click('[data-testid="tab-meta"]'); await sleep(300); await shot(page, '06-studio-permissions.png')

// ---------- Runtime ----------
console.log('Runtime…')
await page.goto(`${BASE}/runtime.html`, { waitUntil: 'networkidle' })
await sleep(400)
await shot(page, '07-runtime-dashboard.png')
await page.click('[data-testid="page-tab-records"]'); await sleep(300); await shot(page, '08-runtime-list.png')
await page.locator('[data-testid^="row-"]').first().click(); await sleep(400)
await shot(page, '09-runtime-record-detail.png')
// permission gating: switch to a no-role user
await page.click('[data-testid="page-tab-records"]'); await sleep(200)
await page.selectOption('[data-testid="pick-user"]', 'guest'); await sleep(300)
await shot(page, '10-runtime-permission-denied.png')

await browser.close()
console.log('done ->', outDir)
