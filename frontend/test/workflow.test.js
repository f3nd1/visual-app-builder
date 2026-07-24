import { describe, it, expect } from 'vitest'
import { addState, removeState, addTransition, removeTransition } from '../src/lib/workflowMutations.js'
import { workflowDiagnostics } from '../src/lib/workflowChecks.js'
import {
  addAutomation, setPartType, addCondition, addAction, removeAction,
} from '../src/lib/automationMutations.js'
import { validateDefinition } from '../src/lib/validate.js'
import { blankDefinition } from '../src/lib/blank.js'
import qa from '../../examples/qa_lifecycle_manager.json'

describe('workflow mutations stay schema-valid', () => {
  it('adds states/transitions with valid refs', () => {
    const def = blankDefinition()
    const a = addState(def, 'Planned')
    const b = addState(def, 'Assigned')
    addTransition(def, a, b, 'Assign', 'QA Manager')
    expect(validateDefinition(def)).toEqual([])
  })

  it('removing a state drops transitions that referenced it (stays valid)', () => {
    const def = blankDefinition()
    const a = addState(def, 'A')
    const b = addState(def, 'B')
    const t = addTransition(def, a, b)
    removeState(def, b)
    expect(def.workflow.transitions.find((x) => x.id === t)).toBeUndefined()
    expect(validateDefinition(def)).toEqual([])
  })
})

describe('workflow diagnostics', () => {
  it('flags an orphan state', () => {
    const def = blankDefinition()
    addState(def, 'Lonely')
    expect(workflowDiagnostics(def).orphan.size).toBe(1)
  })

  it('the QA example workflow is fully connected (no orphan/unreachable)', () => {
    const d = workflowDiagnostics(qa)
    expect(d.orphan.size).toBe(0)
    expect(d.unreachable.size).toBe(0)
  })

  it('flags an unreachable state', () => {
    const def = blankDefinition()
    const a = addState(def, 'Start')
    const b = addState(def, 'Mid')
    const c = addState(def, 'Island')
    const d = addState(def, 'Island2')
    addTransition(def, a, b)
    addTransition(def, c, d) // c,d form a separate island; c is a start, d reachable, but not from a
    const diag = workflowDiagnostics(def)
    // c has no incoming -> treated as a start, so the island is reachable from itself.
    // Make it genuinely unreachable: give c an incoming from d (pure cycle island).
    addTransition(def, d, c)
    const diag2 = workflowDiagnostics(def)
    expect(diag2.unreachable.has('island')).toBe(true)
  })
})

describe('automation editor output matches the schema shape', () => {
  it('new automation validates and has trigger/conditions/actions', () => {
    const def = blankDefinition()
    const id = addAutomation(def)
    const a = def.automations.find((x) => x.id === id)
    expect(a.trigger.type).toBe('record_created')
    expect(Array.isArray(a.conditions)).toBe(true)
    expect(a.actions.length).toBe(1)
    expect(validateDefinition(def)).toEqual([])
  })

  it('changing a part type reseeds its params (no stale keys)', () => {
    const def = blankDefinition()
    addAutomation(def)
    const a = def.automations[0]
    addCondition(a, 'field_equals')
    a.conditions[0].field = 'status'
    a.conditions[0].value = 'open'
    a.conditions[0].type = 'checklist_complete'
    setPartType(a.conditions[0], 'condition')
    expect(a.conditions[0]).toEqual({ type: 'checklist_complete' }) // field/value gone
    expect(validateDefinition(def)).toEqual([])
  })

  it('actions can be added/removed', () => {
    const def = blankDefinition()
    addAutomation(def)
    const a = def.automations[0]
    addAction(a, 'block_submission')
    expect(a.actions).toHaveLength(2)
    removeAction(a, 1)
    expect(a.actions).toHaveLength(1)
  })
})
