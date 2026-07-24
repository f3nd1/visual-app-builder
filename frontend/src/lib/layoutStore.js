// Studio-only canvas layout (node x/y positions). This is DELIBERATELY separate
// from the schema-locked definition store: the schema's workflow state object
// is additionalProperties:false, so coordinates must never enter
// definition_json. Nothing here is ever read by store.export().
//
// Scoped by application code + version so different apps/versions keep their own
// arrangement. Persisted to localStorage when available (a browser); in Node
// (tests) it degrades to in-memory only.

import { reactive, watch } from 'vue'

const KEY = 'vab-studio-layout'

function hasLS() {
  try {
    return typeof localStorage !== 'undefined' && localStorage !== null
  } catch {
    return false
  }
}
function load() {
  if (!hasLS()) return {}
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {}
  } catch {
    return {}
  }
}

// { [scope]: { [canvas]: { [nodeId]: {x, y} } } }
const state = reactive({ layouts: load() })

if (hasLS()) {
  watch(
    () => state.layouts,
    (v) => {
      try {
        localStorage.setItem(KEY, JSON.stringify(v))
      } catch {
        /* quota / disabled storage — layout is non-critical, ignore */
      }
    },
    { deep: true },
  )
}

export function scopeKey(def) {
  return `${def.application?.code || 'app'}@${def.application?.version || '0'}`
}

function canvasMap(def, canvas) {
  const s = scopeKey(def)
  const byScope = (state.layouts[s] ||= {})
  return (byScope[canvas] ||= {})
}

export function getNodePos(def, canvas, nodeId) {
  return canvasMap(def, canvas)[nodeId] || null
}

export function setNodePos(def, canvas, nodeId, pos) {
  canvasMap(def, canvas)[nodeId] = { x: pos.x, y: pos.y }
}

// Ensure every id has a position; missing ones are seeded via seedFn(id, index).
export function ensurePositions(def, canvas, ids, seedFn) {
  const map = canvasMap(def, canvas)
  ids.forEach((id, i) => {
    if (!map[id]) map[id] = seedFn(id, i)
  })
  return map
}

// Test/introspection helper.
export const _state = state
