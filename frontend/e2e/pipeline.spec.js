import { test, expect } from '@playwright/test'

// The full designer -> user loop, entirely in mock: design/edit an app in the
// Studio, publish it, then see and operate exactly that published version in
// the Runtime. Studio (/index.html) and Runtime (/runtime.html) are separate
// bundles that share the publication store via localStorage on the same origin.

test('design in Studio, publish, then run the published app in Runtime', async ({ page }) => {
  // --- Studio: load, rename to a unique code, publish ---
  await page.goto('/index.html')
  await page.getByTestId('load-example').click()
  // give it a unique application code so it appears as its own published app
  const code = 'piped_demo_app'
  await page.getByTestId('app-code').fill(code)
  await page.getByTestId('publish').click()
  await expect(page.getByTestId('publish-msg')).toContainText(`Published ${code} v1`)
  await expect(page.getByTestId('publish-msg')).toContainText('checksum')

  // --- Runtime: the published app is listed and runs ---
  await page.goto('/runtime.html')
  const picker = page.getByTestId('pick-definition')
  await expect(picker).toContainText(code)
  await picker.selectOption(code)
  await page.getByTestId('page-tab-records').click()
  await expect(page.locator('[data-testid^="row-"]').first()).toBeVisible()
})

test('publishing again creates a new version; both are selectable in Runtime', async ({ page }) => {
  await page.goto('/index.html')
  await page.getByTestId('load-example').click()
  await page.getByTestId('app-code').fill('versioned_app')
  await page.getByTestId('publish').click()
  await expect(page.getByTestId('publish-msg')).toContainText('v1')
  // edit and publish again -> v2
  await page.getByTestId('app-code').fill('versioned_app') // (no-op edit; still a new version)
  await page.getByTestId('publish').click()
  await expect(page.getByTestId('publish-msg')).toContainText('v2')

  await page.goto('/runtime.html')
  await page.getByTestId('pick-definition').selectOption('versioned_app')
  const versions = page.getByTestId('pick-version')
  await expect(versions.locator('option')).toHaveCount(3) // "active" + v1 + v2
})

test('publish is blocked when the definition has registry violations', async ({ page }) => {
  await page.goto('/index.html')
  await page.getByTestId('load-example').click()
  // introduce an unapproved DocType on the first entity
  await page.getByTestId('tab-data_model').click()
  const firstDoctype = page.locator('[data-testid^="doctype-"]').first()
  await firstDoctype.fill('Secret Payroll DocType')
  await expect(page.getByTestId('registry-warning')).toBeVisible()
  await page.getByTestId('publish').click()
  await expect(page.getByTestId('publish-msg')).toContainText('Cannot publish')
})
