import { describe, it, expect } from 'vitest'
import {
  MockApprovedRegistry, ApprovedRegistry, deriveSeed, registryIssues, DEFAULT_APPROVED,
  seedFromFrappeExport,
} from '../src/lib/approvedRegistry.js'
import qa from '../../examples/qa_lifecycle_manager.json'
import dcm from '../../examples/document_control_manager.json'
import mvm from '../../examples/material_vetting_manager.json'

describe('registry is grounded in the example definitions', () => {
  it('default seed contains every DocType/field the three examples use', () => {
    const reg = new MockApprovedRegistry()
    for (const def of [qa, dcm, mvm]) {
      for (const e of def.data_model.entities) {
        expect(reg.isApprovedDocType(e.doctype)).toBe(true)
        for (const f of e.fields) expect(reg.isApprovedField(e.doctype, f)).toBe(true)
      }
    }
  })

  it('all three examples have zero registry issues (they are the seed)', () => {
    const reg = new MockApprovedRegistry()
    for (const def of [qa, dcm, mvm]) expect(registryIssues(def, reg)).toEqual([])
  })
})

describe('registry flags unapproved references', () => {
  const reg = new MockApprovedRegistry()

  it('flags an unknown DocType', () => {
    const def = structuredClone(qa)
    def.data_model.entities[0].doctype = 'Secret Payroll'
    const issues = registryIssues(def, reg)
    expect(issues.some((i) => i.kind === 'doctype' && i.doctype === 'Secret Payroll')).toBe(true)
  })

  it('flags an unapproved field on an approved DocType', () => {
    const def = structuredClone(qa)
    def.data_model.entities[0].fields.push('secret_salary')
    const issues = registryIssues(def, reg)
    expect(issues.some((i) => i.kind === 'field' && i.field === 'secret_salary')).toBe(true)
  })
})

describe('interface shape is drop-in replaceable', () => {
  it('base class throws until implemented (like DataAdapter/PermissionAdapter)', () => {
    const base = new ApprovedRegistry()
    expect(() => base.listDocTypes()).toThrow(/not implemented/)
    expect(() => base.isApprovedDocType('x')).toThrow(/not implemented/)
  })

  it('a custom seed drives a different whitelist', () => {
    const reg = new MockApprovedRegistry([{ doctype: 'Only This', fields: ['a', 'b'] }])
    expect(reg.listDocTypes()).toEqual(['Only This'])
    expect(reg.isApprovedField('Only This', 'a')).toBe(true)
    expect(reg.isApprovedField('Only This', 'z')).toBe(false)
  })

  it('deriveSeed unions fields across definitions', () => {
    const seed = deriveSeed([
      { data_model: { entities: [{ doctype: 'D', fields: ['a'] }] } },
      { data_model: { entities: [{ doctype: 'D', fields: ['b'] }] } },
    ])
    expect(seed).toEqual([{ doctype: 'D', fields: ['a', 'b'] }])
  })
})

describe('seedFromFrappeExport converts real Frappe DocType exports', () => {
  const qaReviewExport = {
    doctype: 'DocType',
    name: 'QA Review',
    fields: [
      { fieldname: 'title', fieldtype: 'Data' },
      { fieldname: 'sb1', fieldtype: 'Section Break' }, // layout — excluded
      { fieldname: 'status', fieldtype: 'Select' },
      { fieldname: 'cb1', fieldtype: 'Column Break' }, // layout — excluded
      { fieldname: 'checklist', fieldtype: 'Table' }, // child table — a real field
    ],
  }

  it('single doc: keeps data fields, drops layout fields, adds name', () => {
    expect(seedFromFrappeExport(qaReviewExport)).toEqual([
      { doctype: 'QA Review', fields: ['name', 'title', 'status', 'checklist'] },
    ])
  })

  it('accepts the {docs:[...]} wrapper and plain arrays; skips non-DocType docs', () => {
    const wrapped = { docs: [qaReviewExport, { doctype: 'Workflow', name: 'ignored' }] }
    expect(seedFromFrappeExport(wrapped)).toHaveLength(1)
    expect(seedFromFrappeExport([qaReviewExport])).toHaveLength(1)
  })

  it('throws when the file contains no DocType documents', () => {
    expect(() => seedFromFrappeExport({ docs: [{ doctype: 'Workflow', name: 'x' }] })).toThrow(/no DocType/)
    expect(() => seedFromFrappeExport({})).toThrow(/no DocType/)
  })

  it('reseed swaps the whitelist: previously-approved DocTypes become violations', () => {
    const reg = new MockApprovedRegistry()
    expect(registryIssues(qa, reg)).toEqual([]) // seeded from examples
    reg.reseed(seedFromFrappeExport(qaReviewExport)) // now ONLY QA Review approved
    const issues = registryIssues(qa, reg)
    expect(issues.some((i) => i.kind === 'doctype' && i.doctype === 'Quality Action')).toBe(true)
    expect(issues.some((i) => i.kind === 'doctype' && i.doctype === 'UAT Run')).toBe(true)
    // and QA Review's example fields not in the export are field violations now
    expect(issues.some((i) => i.kind === 'field' && i.doctype === 'QA Review' && i.field === 'scope')).toBe(true)
  })
})
