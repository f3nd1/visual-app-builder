import { describe, it, expect } from 'vitest'
import { DataAdapter } from '../../src/runtime/adapters/DataAdapter.js'
import { MockDataAdapter } from '../../src/runtime/adapters/MockDataAdapter.js'
import qa from '../../../examples/qa_lifecycle_manager.json'
import dcm from '../../../examples/document_control_manager.json'
import mvm from '../../../examples/material_vetting_manager.json'

describe('DataAdapter base interface', () => {
  it('every method throws until implemented', async () => {
    const a = new DataAdapter()
    await expect(a.getRecord('e', 'n')).rejects.toThrow(/not implemented/)
    await expect(a.listRecords('e')).rejects.toThrow(/not implemented/)
    await expect(a.createRecord('e', {})).rejects.toThrow(/not implemented/)
    await expect(a.updateRecord('e', 'n', {})).rejects.toThrow(/not implemented/)
    await expect(a.checkPermission('e', 'read', {})).rejects.toThrow(/not implemented/)
  })
})

describe('MockDataAdapter works from the definition alone', () => {
  it.each([
    ['qa_lifecycle_manager', qa],
    ['document_control_manager', dcm],
    ['material_vetting_manager', mvm],
  ])('%s: every entity gets listable records', async (_name, def) => {
    const a = new MockDataAdapter(def)
    for (const e of def.data_model.entities) {
      const rows = await a.listRecords(e.id)
      expect(rows.length).toBeGreaterThan(0)
      expect(rows[0]).toHaveProperty('name') // Frappe-style primary key
    }
  })

  it('QA seed produces story-consistent data', async () => {
    const a = new MockDataAdapter(qa)
    const reviews = await a.listRecords('qa_review')
    expect(reviews[0].title).toMatch(/QA review/i)
  })

  it('CRUD round-trips and returns clones (store not mutated by caller)', async () => {
    const a = new MockDataAdapter(qa)
    const created = await a.createRecord('qa_review', { title: 'New', status: 'planned' })
    expect(created.name).toBeTruthy()
    const fetched = await a.getRecord('qa_review', created.name)
    fetched.title = 'mutated locally'
    const refetched = await a.getRecord('qa_review', created.name)
    expect(refetched.title).toBe('New') // caller mutation did not leak into the store
    const updated = await a.updateRecord('qa_review', created.name, { status: 'assigned' })
    expect(updated.status).toBe('assigned')
  })

  it('filters and limit work', async () => {
    const a = new MockDataAdapter(qa)
    await a.createRecord('qa_review', { title: 'X', status: 'closed' })
    const closed = await a.listRecords('qa_review', { filters: { status: 'closed' } })
    expect(closed.every((r) => r.status === 'closed')).toBe(true)
    const one = await a.listRecords('qa_review', { limit: 1 })
    expect(one).toHaveLength(1)
  })

  it('unknown entity throws', async () => {
    const a = new MockDataAdapter(qa)
    await expect(a.listRecords('nope')).rejects.toThrow(/unknown entity/)
  })
})
