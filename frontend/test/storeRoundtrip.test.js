import { describe, it, expect } from 'vitest'
import { store } from '../src/store.js'
import { validateDefinition } from '../src/lib/validate.js'
import { addComponent, addPage } from '../src/lib/pageMutations.js'
import { addState, addTransition } from '../src/lib/workflowMutations.js'
import qa from '../../examples/qa_lifecycle_manager.json'

// Mirrors step 5's acceptance scenario: load the QA example into the Studio
// store, make edits, export, and confirm the exported JSON still validates and
// is exactly what the store held.
describe('Studio store round-trip', () => {
  it('load -> trivial edit -> export still validates and matches', () => {
    store.load(structuredClone(qa))
    store.def.application.description += ' (edited in Studio)'
    const exported = store.export()
    const parsed = JSON.parse(exported)
    expect(validateDefinition(parsed)).toEqual([])
    expect(parsed).toEqual(store.def) // export loses nothing
  })

  it('load -> structural edits across sections -> export still validates', () => {
    store.load(structuredClone(qa))
    const pid = addPage(store.def, 'Extra', 'form')
    addComponent(store.def, store.def.pages.find((p) => p.id === pid), 'metric_group')
    const s = addState(store.def, 'Extra State')
    addTransition(store.def, store.def.workflow.states[0].id, s, 'Go', 'QA Manager')
    const parsed = JSON.parse(store.export())
    expect(validateDefinition(parsed)).toEqual([])
  })
})
