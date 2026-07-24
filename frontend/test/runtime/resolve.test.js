import { describe, it, expect } from 'vitest'
import { resolveEntity, fieldsOf, inferFieldType, computeMetrics, availableTransitions } from '../../src/runtime/engine/resolve.js'
import qa from '../../../examples/qa_lifecycle_manager.json'
import dcm from '../../../examples/document_control_manager.json'
import mvm from '../../../examples/material_vetting_manager.json'

const ALL = [
  ['qa_lifecycle_manager', qa],
  ['document_control_manager', dcm],
  ['material_vetting_manager', mvm],
]

describe('renderer resolution is definition-driven for all three apps', () => {
  it.each(ALL)('%s: list & form components resolve to an entity with fields', (_n, def) => {
    for (const page of def.pages) {
      for (const c of page.components) {
        if (c.type === 'record_list' || c.type === 'record_form') {
          const entity = resolveEntity(def, c)
          expect(entity).toBeTruthy()
          expect(fieldsOf(entity).length).toBeGreaterThan(0)
        }
      }
    }
  })

  it.each(ALL)('%s: status fields infer a select over workflow states', (_n, def) => {
    const entity = def.data_model.entities.find((e) => e.fields.includes('status'))
    if (!entity) return
    const spec = inferFieldType(def, entity.id, 'status')
    expect(spec.widget).toBe('select')
    expect(spec.options.length).toBe(def.workflow.states.length)
  })
})

describe('field inference by convention', () => {
  it('dates, attachments and plain text', () => {
    expect(inferFieldType(qa, 'qa_review', 'due_date').widget).toBe('date')
    expect(inferFieldType(dcm, 'document_version', 'file').widget).toBe('attachment')
    expect(inferFieldType(qa, 'qa_review', 'scope').widget).toBe('text')
  })
})

describe('metrics and transitions', () => {
  it('computeMetrics totals and breaks down by status', () => {
    const rows = [{ status: 'a' }, { status: 'a' }, { status: 'b' }]
    const m = computeMetrics(rows, { fields: ['status'] })
    expect(m[0]).toEqual({ label: 'Total', value: 3 })
    expect(m.find((x) => x.label === 'a').value).toBe(2)
  })

  it('availableTransitions filters by from-state and optional role', () => {
    const fromPlanned = availableTransitions(qa, 'planned')
    expect(fromPlanned.every((t) => t.from === 'planned')).toBe(true)
    expect(fromPlanned.length).toBeGreaterThan(0)
    const asManager = availableTransitions(qa, 'planned', 'QA Manager')
    expect(asManager.every((t) => t.role === 'QA Manager')).toBe(true)
  })
})
