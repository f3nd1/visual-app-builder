// Automation mutations. Each part is { type, ...seededParams }; changing a
// part's type reseeds its params from the catalogue so stale keys never leak.
import { uniqueId } from './ids.js'
import { checkedSectionIds } from './defIds.js'
import { TRIGGERS, CONDITIONS, ACTIONS } from './automationCatalogue.js'

function seed(map, type) {
  const part = { type }
  for (const p of map[type]?.params || []) part[p.key] = ''
  return part
}

export function addAutomation(def, label = 'automation') {
  const id = uniqueId(label, checkedSectionIds(def))
  def.automations.push({
    id,
    trigger: seed(TRIGGERS, 'record_created'),
    conditions: [],
    actions: [seed(ACTIONS, 'send_system_notification')],
  })
  return id
}
export function removeAutomation(def, id) {
  def.automations = def.automations.filter((a) => a.id !== id)
}

export function setPartType(part, kind) {
  const map = kind === 'trigger' ? TRIGGERS : kind === 'condition' ? CONDITIONS : ACTIONS
  // reseed: drop old param keys, keep only type + fresh params
  for (const k of Object.keys(part)) if (k !== 'type') delete part[k]
  const fresh = seed(map, part.type)
  Object.assign(part, fresh)
}

export function addCondition(auto, type = 'field_equals') {
  auto.conditions.push(seed(CONDITIONS, type))
}
export function removeCondition(auto, i) {
  auto.conditions.splice(i, 1)
}
export function addAction(auto, type = 'send_email') {
  auto.actions.push(seed(ACTIONS, type))
}
export function removeAction(auto, i) {
  auto.actions.splice(i, 1)
}

export { seed }
