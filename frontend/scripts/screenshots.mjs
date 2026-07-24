// Capture screenshots of the Studio and Runtime against the dev server.
// Run:  node scripts/screenshots.mjs   (dev server must be running on $BASE)
// Saves descriptively-named PNGs to docs/screenshots/ (committed).
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const BASE = process.env.BASE || 'http://localhost:5178'
const CHROMIUM = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'docs', 'screenshots')
mkdirSync(outDir, { recursive: true })

const shot = async (page, name) => {
  await page.screenshot({ path: join(outDir, name), fullPage: true })
  console.log('  saved', name)
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await chromium.launch({ executablePath: CHROMIUM })

// ---------------- Studio (own context) ----------------
console.log('Studio…')
const sctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const s = await sctx.newPage()
s.on('dialog', (d) => d.accept()) // auto-accept the registry-import alert
await s.goto(`${BASE}/index.html`, { waitUntil: 'networkidle' })
await s.click('[data-testid="load-example"]'); await sleep(300)

await s.click('[data-testid="tab-application"]'); await sleep(200); await shot(s, 'studio-application.png')
await s.click('[data-testid="tab-data_model"]'); await sleep(200); await shot(s, 'studio-data-model.png')

// Pages: show the record-detail page (form + workflow-history = a few components)
await s.click('[data-testid="tab-pages"]'); await sleep(300)
await s.click('text=Record Detail'); await sleep(300); await shot(s, 'studio-page-canvas.png')
// component menu open (kebab path)
await s.click('[data-testid="kebab-record_form"]'); await sleep(200); await shot(s, 'studio-page-canvas-context-menu.png')
await s.keyboard.press('Escape')

await s.click('[data-testid="tab-workflow"]'); await sleep(1000); await shot(s, 'studio-workflow-editor.png')

await s.click('[data-testid="tab-automations"]'); await sleep(200)
await s.click('text=+ Automation'); await sleep(200)
await s.click('text=+ condition').catch(() => {}); await sleep(200)
await shot(s, 'studio-automation-editor.png')

await s.click('[data-testid="tab-meta"]'); await sleep(300); await shot(s, 'studio-meta-permissions.png')
await s.click('text=Translations'); await sleep(200); await shot(s, 'studio-meta-translations.png')

// Publish while the definition is still clean (valid + registry-clean)
await s.click('[data-testid="tab-application"]'); await sleep(150)
await s.click('[data-testid="publish"]'); await sleep(300); await shot(s, 'studio-publish.png')

// Issues panel: introduce a schema violation (invalid application.code)
await s.fill('[data-testid="app-code"]', 'Not A Valid Code'); await sleep(200)
await s.click('[data-testid="tab-issues"]'); await sleep(200); await shot(s, 'studio-issues-panel.png')

// Data Model registry violation: import a whitelist approving only QA Review
await s.click('[data-testid="tab-data_model"]'); await sleep(200)
await s.setInputFiles('[data-testid="import-registry-input"]', {
  name: 'ucc_export.json',
  mimeType: 'application/json',
  buffer: Buffer.from(JSON.stringify({
    doctype: 'DocType', name: 'QA Review',
    fields: [{ fieldname: 'title', fieldtype: 'Data' }, { fieldname: 'status', fieldtype: 'Select' }],
  })),
})
await sleep(400); await shot(s, 'studio-data-model-registry-violation.png')
await sctx.close()

// ---------------- Runtime (fresh context: harness seeds the 3 examples as published) ----------------
console.log('Runtime…')
const rctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const r = await rctx.newPage()
r.on('dialog', (d) => d.accept())
await r.goto(`${BASE}/runtime.html`, { waitUntil: 'networkidle' }); await sleep(500)
await shot(r, 'runtime-harness-picker.png') // header lists all published apps + versions

await r.click('[data-testid="page-tab-records"]'); await sleep(300); await shot(r, 'runtime-list-view.png')
await r.locator('[data-testid^="row-"]').first().click(); await sleep(400); await shot(r, 'runtime-record-detail.png')
// perform a workflow transition (Administrator = superuser, at least one enabled)
await r.locator('[data-testid^="transition-"]:not([disabled])').first().click(); await sleep(400)
await shot(r, 'runtime-workflow-transition.png')

// Automation log: upload a definition that has a record_created automation, then create a record
await r.setInputFiles('[data-testid="load-export-input"]', {
  name: 'demo_auto.json',
  mimeType: 'application/json',
  buffer: Buffer.from(JSON.stringify({
    schema_version: '0.1',
    application: { code: 'demo_auto', title: 'Demo Auto', description: '', status: 'draft', version: '0.1.0' },
    pages: [{ id: 'new_thing', title: 'New Thing', type: 'form', components: [{ id: 'f', type: 'record_form' }] }],
    data_model: { entities: [{ id: 'thing', doctype: 'Thing', mode: 'new', fields: ['title', 'status'] }], relationships: [] },
    workflow: { states: [], transitions: [] },
    automations: [{
      id: 'on_create', trigger: { type: 'record_created' }, conditions: [],
      actions: [{ type: 'send_email', notification: 'welcome' }, { type: 'update_field', field: 'title', value: 'AUTO-SET' }],
    }],
    permissions: [{ role: 'System Manager', entity: 'thing', read: true, write: true, create: true, submit: true }],
    translations: {}, notifications: [], tests: [],
  })),
})
await sleep(400)
await r.fill('[data-testid="field-title"]', 'Hello'); await sleep(150)
await r.click('[data-testid="form-save"]'); await sleep(400); await shot(r, 'runtime-automation-log.png')
// clear the log so the following proof shots aren't cluttered by it
await r.click('[data-testid="autolog"] button').catch(() => {}); await sleep(150)

// Shared-runtime proof: the other two demo apps through the SAME renderers
await r.selectOption('[data-testid="pick-definition"]', 'document_control_manager'); await sleep(300)
await r.click('[data-testid="page-tab-records"]'); await sleep(300); await shot(r, 'runtime-document-control.png')
await r.selectOption('[data-testid="pick-definition"]', 'material_vetting_manager'); await sleep(300)
await r.click('[data-testid="page-tab-records"]'); await sleep(300); await shot(r, 'runtime-material-vetting.png')

// Permission gating: back to QA as a no-role user
await r.selectOption('[data-testid="pick-definition"]', 'qa_lifecycle_manager'); await sleep(300)
await r.click('[data-testid="page-tab-records"]'); await sleep(200)
await r.selectOption('[data-testid="pick-user"]', 'guest'); await sleep(300); await shot(r, 'runtime-permission-denied.png')
await rctx.close()

await browser.close()
console.log('done ->', outDir)
