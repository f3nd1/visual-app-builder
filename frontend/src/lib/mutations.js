// Small mutation helpers shared by editors. Each keeps the definition in exact
// schema shape and generates schema-valid, section-unique stable IDs. Kept
// framework-free so they can be unit-tested in Node.

import { uniqueId } from './ids.js'
import { checkedSectionIds } from './defIds.js'

const idsOf = (arr) => (arr || []).map((x) => x.id)

// --- Data model: entities ---
export function addEntity(def, doctype = 'New DocType') {
  // entities share the checked-section id namespace
  const id = uniqueId(doctype, checkedSectionIds(def))
  def.data_model.entities.push({ id, doctype, mode: 'new', fields: [] })
  return id
}
export function removeEntity(def, id) {
  const dm = def.data_model
  dm.entities = dm.entities.filter((e) => e.id !== id)
  // drop relationships that referenced it — keeps the definition valid
  dm.relationships = dm.relationships.filter((r) => r.source !== id && r.target !== id)
}

// --- Data model: relationships ---
export function addRelationship(def, source, target, type = 'link') {
  const id = uniqueId(`${source}_${target}`, idsOf(def.data_model.relationships))
  def.data_model.relationships.push({ id, source, target, type })
  return id
}
export function removeRelationship(def, id) {
  def.data_model.relationships = def.data_model.relationships.filter((r) => r.id !== id)
}
