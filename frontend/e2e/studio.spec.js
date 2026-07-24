import { test, expect } from '@playwright/test'

// These tests drive the ACTUAL rendered Studio in Chromium — the drag-and-drop,
// context menus and node-canvas interactions that the Vitest unit suite cannot
// reach (it only covers the underlying state mutations). This substitutes for a
// human eyeballing the UI until the user can run it on their Mac.

const comps = (page) => page.locator('[data-testid^="comp-"]')
const nodes = (page) => page.locator('.vue-flow__node')
const edges = (page) => page.locator('.vue-flow__edge')

// Native HTML5 drag-and-drop: Playwright's mouse-based dragTo does not fire the
// HTML5 dragstart/drop events, so we dispatch them with one shared DataTransfer
// (exactly what the components read/write via ev.dataTransfer).
async function html5Drag(page, sourceTestId, targetTestId) {
  await page.evaluate(
    ({ s, t }) => {
      const src = document.querySelector(`[data-testid="${s}"]`)
      const tgt = document.querySelector(`[data-testid="${t}"]`)
      const dt = new DataTransfer()
      const ev = (type, el) => el.dispatchEvent(new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: dt }))
      ev('dragstart', src)
      ev('dragover', tgt)
      ev('drop', tgt)
      ev('dragend', src)
    },
    { s: sourceTestId, t: targetTestId },
  )
}

// Vue Flow transitions are created by dragging between node handles (pointer
// events, which Playwright's mouse DOES drive). Move in steps so Vue Flow
// registers the connection drag.
async function connectHandles(page, fromId, toId) {
  const src = page.locator(`.vue-flow__node[data-id="${fromId}"] .vue-flow__handle-right`)
  const tgt = page.locator(`.vue-flow__node[data-id="${toId}"] .vue-flow__handle-left`)
  const a = await src.boundingBox()
  const b = await tgt.boundingBox()
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2)
  await page.mouse.down()
  await page.mouse.move(a.x + 40, a.y, { steps: 5 })
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 10 })
  await page.mouse.up()
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('drag a component from the palette onto the page canvas', async ({ page }) => {
  await page.getByTestId('load-example').click()
  await page.getByTestId('tab-pages').click()
  const before = await comps(page).count()
  await html5Drag(page, 'pal-metric_group', 'page-canvas')
  await expect(comps(page)).toHaveCount(before + 1)
})

test('drag a Data Model field onto the canvas to auto-create a bound component', async ({ page }) => {
  await page.getByTestId('load-example').click()
  await page.getByTestId('tab-pages').click()
  const before = await comps(page).count()
  await html5Drag(page, 'field-qa_review-status', 'page-canvas')
  await expect(comps(page)).toHaveCount(before + 1)
  // the new bound component surfaces the field name in its summary
  await expect(page.getByTestId('page-canvas')).toContainText('status')
})

test('right-click a component -> Duplicate adds a copy', async ({ page }) => {
  await page.getByTestId('load-example').click()
  await page.getByTestId('tab-pages').click()
  const first = comps(page).first()
  const before = await comps(page).count()
  await first.click({ button: 'right' })
  await expect(page.getByTestId('ctx-menu')).toBeVisible()
  await page.getByTestId('ctx-Duplicate').click()
  await expect(comps(page)).toHaveCount(before + 1)
})

test('kebab menu -> Delete removes a component (kebab path, not right-click)', async ({ page }) => {
  await page.getByTestId('load-example').click()
  await page.getByTestId('tab-pages').click()
  const before = await comps(page).count()
  const firstId = await comps(page).first().getAttribute('data-testid')
  const compId = firstId.replace('comp-', '')
  await page.getByTestId(`kebab-${compId}`).click()
  await expect(page.getByTestId('ctx-menu')).toBeVisible()
  await page.getByTestId('ctx-Delete').click()
  await expect(comps(page)).toHaveCount(before - 1)
})

test('add a workflow state node and connect a transition by dragging handles', async ({ page }) => {
  await page.getByTestId('tab-workflow').click()
  await page.getByTestId('add-state').click()
  await page.getByTestId('add-state').click()
  await expect(nodes(page)).toHaveCount(2)
  const ids = await nodes(page).evaluateAll((els) => els.map((e) => e.getAttribute('data-id')))
  const edgesBefore = await edges(page).count()
  await connectHandles(page, ids[0], ids[1])
  await expect(edges(page)).toHaveCount(edgesBefore + 1)
})

test('right-click a workflow node shows its context menu (Delete state)', async ({ page }) => {
  await page.getByTestId('tab-workflow').click()
  await page.getByTestId('add-state').click()
  await nodes(page).first().click({ button: 'right' })
  await expect(page.getByTestId('ctx-menu')).toBeVisible()
  await expect(page.getByTestId('ctx-Delete state')).toBeVisible()
  await page.getByTestId('ctx-Delete state').click()
  await expect(nodes(page)).toHaveCount(0)
})
