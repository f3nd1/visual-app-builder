import { describe, it, expect } from 'vitest'
import { store } from '../src/store.js'
import { validateDefinition } from '../src/lib/validate.js'
import { addComponent, addPage } from '../src/lib/pageMutations.js'
import { addState, addTransition } from '../src/lib/workflowMutations.js'
import qa from '../../examples/qa_lifecycle_manager.json'
import dcm from '../../examples/document_control_manager.json'
import mvm from '../../examples/material_vetting_manager.json'

// The Studio must generalise beyond QA: loading and re-exporting any of the
// three demo definitions must lose nothing and stay valid. This is the
// in-scope reuse signal (the runtime reuse proof needs the Runtime bundle,
// which is out of scope this session).
describe('Studio round-trips all three demo definitions unchanged', () => {
  it.each([
    ['qa_lifecycle_manager', qa],
    ['document_control_manager', dcm],
    ['material_vetting_manager', mvm],
  ])('%s: load -> export is byte-identical and valid', (_name, def) => {
    store.load(structuredClone(def))
    const parsed = JSON.parse(store.export())
    expect(validateDefinition(parsed)).toEqual([])
    expect(parsed).toEqual(def)
  })
})

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
