// Page + component mutations. Component ids are made unique across the WHOLE
// definition (every component on every page), which is stricter than
// check_repository.py requires but keeps ids genuinely stable references.

import { uniqueId } from './ids.js'
import { checkedSectionIds } from './defIds.js'
import { COMPONENT_TYPES, DEFAULT_FIELD_COMPONENT } from './componentRegistry.js'

// Everything in a definition is JSON by construction, so a JSON clone is both
// sufficient and safe on Vue reactive proxies (structuredClone can choke on a
// proxy in the browser, which unit tests using plain objects never surface).
const clone = (x) => JSON.parse(JSON.stringify(x))

export function allComponentIds(def) {
  const ids = []
  for (const p of def.pages || []) for (const c of p.components || []) ids.push(c.id)
  return ids
}

const PAGE_TYPES = ['list', 'form', 'dashboard', 'workspace']

export function addPage(def, title = 'New Page', type = 'form') {
  const id = uniqueId(title, checkedSectionIds(def))
  def.pages.push({ id, title, type, components: [] })
  return id
}
export function removePage(def, id) {
  def.pages = def.pages.filter((p) => p.id !== id)
}

// Build a new component of `type`, seeded from the registry defaults, with a
// stable id and any caller overrides (e.g. entity+field from a field drag).
export function makeComponent(def, type, overrides = {}) {
  const reg = COMPONENT_TYPES[type]
  if (!reg) throw new Error(`unknown component type: ${type}`)
  const stem = overrides.field || reg.label || type
  const id = uniqueId(stem, allComponentIds(def))
  return { id, type, ...clone(reg.defaults || {}), ...overrides }
}

// Insert at `index` (default: end) so a live drop placeholder can position it.
export function addComponent(def, page, type, overrides = {}, index = null) {
  const comp = makeComponent(def, type, overrides)
  if (index == null || index < 0 || index > page.components.length) {
    page.components.push(comp)
  } else {
    page.components.splice(index, 0, comp)
  }
  return comp.id
}

// A data-model field dropped on the canvas becomes a bound field component.
export function addFieldComponent(def, page, entityId, fieldName, index = null) {
  return addComponent(
    def,
    page,
    DEFAULT_FIELD_COMPONENT,
    { label: fieldName, entity: entityId, field: fieldName },
    index,
  )
}

export function duplicateComponent(def, page, id) {
  const i = page.components.findIndex((c) => c.id === id)
  if (i < 0) return null
  const src = page.components[i]
  const copy = clone(src)
  copy.id = uniqueId(src.id, allComponentIds(def))
  page.components.splice(i + 1, 0, copy)
  return copy.id
}

export function removeComponent(page, id) {
  page.components = page.components.filter((c) => c.id !== id)
}

export function moveComponent(page, id, dir) {
  const i = page.components.findIndex((c) => c.id === id)
  const j = i + dir
  if (i < 0 || j < 0 || j >= page.components.length) return
  const [c] = page.components.splice(i, 1)
  page.components.splice(j, 0, c)
}

export { PAGE_TYPES }
