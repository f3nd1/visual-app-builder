import { describe, it, expect } from 'vitest'
import { getNodePos, setNodePos, ensurePositions, scopeKey } from '../src/lib/layoutStore.js'
import { validateDefinition } from '../src/lib/validate.js'
import { store } from '../src/store.js'
import qa from '../../examples/qa_lifecycle_manager.json'

describe('layoutStore is separate from the definition and never leaks', () => {
  it('setting positions does not mutate the definition or break validation', () => {
    store.load(structuredClone(qa))
    const before = store.export()
    ensurePositions(store.def, 'workflow', store.def.workflow.states.map((s) => s.id), (_id, i) => ({ x: i * 100, y: 0 }))
    setNodePos(store.def, 'workflow', store.def.workflow.states[0].id, { x: 999, y: 42 })
    const after = store.export()
    expect(after).toBe(before) // definition_json unchanged by any layout write
    expect(validateDefinition(JSON.parse(after))).toEqual([])
  })

  it('positions persist in-memory keyed by app code + version', () => {
    store.load(structuredClone(qa))
    setNodePos(store.def, 'workflow', 'planned', { x: 10, y: 20 })
    expect(getNodePos(store.def, 'workflow', 'planned')).toEqual({ x: 10, y: 20 })
  })

  it('different app/version scopes keep independent layouts', () => {
    const a = structuredClone(qa)
    const b = structuredClone(qa)
    b.application.version = '9.9.9'
    expect(scopeKey(a)).not.toBe(scopeKey(b))
    setNodePos(a, 'workflow', 'planned', { x: 1, y: 1 })
    setNodePos(b, 'workflow', 'planned', { x: 2, y: 2 })
    expect(getNodePos(a, 'workflow', 'planned')).toEqual({ x: 1, y: 1 })
    expect(getNodePos(b, 'workflow', 'planned')).toEqual({ x: 2, y: 2 })
  })
})
