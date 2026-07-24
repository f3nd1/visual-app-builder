import { test, expect } from '@playwright/test'

// Drives the Runtime dev harness (separate bundle at /runtime.html): render,
// permission gating, list->detail navigation, workflow transition, and an
// automation firing. Substitutes for a real ERPNext-connected demo.

test.beforeEach(async ({ page }) => {
  await page.goto('/runtime.html')
})

test('renders the default QA app: dashboard metrics and a records list', async ({ page }) => {
  // dashboard page has a metric_group
  await expect(page.locator('[data-testid^="metrics-"]')).toBeVisible()
  // records page has a list with rows
  await page.getByTestId('page-tab-records').click()
  await expect(page.locator('[data-testid^="list-"]')).toBeVisible()
  await expect(page.locator('[data-testid^="row-"]').first()).toBeVisible()
})

test('permission gating: a no-role user is denied read', async ({ page }) => {
  await page.getByTestId('page-tab-records').click()
  await expect(page.locator('[data-testid^="row-"]').first()).toBeVisible()
  await page.getByTestId('pick-user').selectOption('guest')
  await expect(page.getByTestId('read-denied')).toBeVisible()
  await page.getByTestId('pick-user').selectOption('Administrator')
  await expect(page.locator('[data-testid^="row-"]').first()).toBeVisible()
})

test('open a record from the list, then move it through a workflow transition', async ({ page }) => {
  await page.getByTestId('page-tab-records').click()
  await page.locator('[data-testid^="row-"]').first().click()
  // navigated to the detail page with the form + workflow history
  await expect(page.getByTestId('form-save')).toBeVisible()
  const stateBefore = await page.getByTestId('wfh-state').textContent()
  // as Administrator (superuser) at least one transition is enabled
  const firstTransition = page.locator('[data-testid^="transition-"]:not([disabled])').first()
  await firstTransition.click()
  await expect(page.getByTestId('wfh-state')).not.toHaveText(stateBefore)
})

test('malformed definition upload is rejected, app keeps running', async ({ page }) => {
  let dialogMsg = ''
  page.on('dialog', (d) => { dialogMsg = d.message(); d.accept() })
  await page.getByTestId('load-export-input').setInputFiles({
    name: 'broken.json',
    mimeType: 'application/json',
    // page with no components array -> would crash openRecord un-gated
    buffer: Buffer.from(JSON.stringify({ application: { code: 'x' }, pages: [{ id: 'p', title: 'P', type: 'form' }], data_model: { entities: [] } })),
  })
  await expect.poll(() => dialogMsg).toContain('Rejected definition')
  // the previously-loaded published app still works
  await page.getByTestId('page-tab-records').click()
  await expect(page.locator('[data-testid^="row-"]').first()).toBeVisible()
})

test('creating a record fires a record_created automation (logged)', async ({ page }) => {
  // upload a small definition that has an automation, via the harness loader
  const def = {
    schema_version: '0.1',
    application: { code: 'demo_auto', title: 'Demo Auto', description: '', status: 'draft', version: '0.1.0' },
    pages: [{ id: 'new_thing', title: 'New Thing', type: 'form', components: [{ id: 'f', type: 'record_form' }] }],
    data_model: { entities: [{ id: 'thing', doctype: 'Thing', mode: 'new', fields: ['title', 'status'] }], relationships: [] },
    workflow: { states: [], transitions: [] },
    automations: [{
      id: 'on_create',
      trigger: { type: 'record_created' },
      conditions: [],
      actions: [{ type: 'send_email', notification: 'welcome' }, { type: 'update_field', field: 'title', value: 'AUTO-SET' }],
    }],
    permissions: [{ role: 'System Manager', entity: 'thing', read: true, write: true, create: true, submit: true }],
    translations: {}, notifications: [], tests: [],
  }
  await page.getByTestId('load-export-input').setInputFiles({
    name: 'demo_auto.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(def)),
  })
  // the form page is the only page; create-mode form is shown
  await expect(page.getByTestId('form-save')).toBeVisible()
  await page.getByTestId('field-title').fill('Hello')
  await page.getByTestId('form-save').click()
  const log = page.getByTestId('autolog')
  await expect(log).toContainText('on_create')
  await expect(log).toContainText('would send_email')
})
