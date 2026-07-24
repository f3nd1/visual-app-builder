// Approved DocType Registry (decision D-004, docs/SECURITY_AND_PERMISSIONS.md):
// the whitelist of DocTypes and fields a definition may reference. This is the
// mock. Its default seed is DERIVED from the three example definitions — real
// usage, not invented — so the registry and the examples can never drift.
//
// Interface shape mirrors DataAdapter / PermissionAdapter (a base class that
// throws + a Mock implementation), so a future FrappeApprovedRegistry that
// reads the real "Approved DocType Registry" DocType is a drop-in replacement.

import { reactive } from 'vue'
import qa from '../../../examples/qa_lifecycle_manager.json'
import dcm from '../../../examples/document_control_manager.json'
import mvm from '../../../examples/material_vetting_manager.json'

// Union the doctype -> fields map across a set of definitions.
export function deriveSeed(defs) {
  const map = new Map()
  for (const def of defs) {
    for (const e of def.data_model?.entities || []) {
      const fields = new Set(map.get(e.doctype) || [])
      for (const f of e.fields || []) fields.add(f)
      map.set(e.doctype, fields)
    }
  }
  return [...map.entries()].map(([doctype, fields]) => ({ doctype, fields: [...fields] }))
}

export const DEFAULT_APPROVED = deriveSeed([qa, dcm, mvm])

export class ApprovedRegistry {
  listDocTypes() { throw new Error('ApprovedRegistry.listDocTypes not implemented') }
  isApprovedDocType(_dt) { throw new Error('ApprovedRegistry.isApprovedDocType not implemented') }
  approvedFields(_dt) { throw new Error('ApprovedRegistry.approvedFields not implemented') }
  isApprovedField(_dt, _f) { throw new Error('ApprovedRegistry.isApprovedField not implemented') }
}

export class MockApprovedRegistry extends ApprovedRegistry {
  constructor(seed = DEFAULT_APPROVED) {
    super()
    // reactive Map: Studio computeds (approved lists, violation warnings)
    // re-evaluate automatically when the registry is reseeded.
    this.map = reactive(new Map(seed.map((d) => [d.doctype, d.fields])))
  }
  // Replace the whole whitelist (e.g. after importing a real UCC field list).
  // ponytail: in-memory only — a reseed lasts the session; persist to
  // localStorage only if designers actually need it to survive reloads.
  reseed(seed) {
    this.map.clear()
    for (const d of seed) this.map.set(d.doctype, d.fields)
  }
  listDocTypes() {
    return [...this.map.keys()]
  }
  isApprovedDocType(dt) {
    return this.map.has(dt)
  }
  approvedFields(dt) {
    return this.map.get(dt) || []
  }
  isApprovedField(dt, f) {
    return (this.map.get(dt) || []).includes(f)
  }
}

// Registry violations in a definition's data model. Kept separate from the
// schema validator so the schema-lock (round-trip) stays pure — this is a
// governance check, surfaced in the Studio's Data Model editor.
export function registryIssues(def, registry) {
  const issues = []
  for (const e of def.data_model?.entities || []) {
    if (!registry.isApprovedDocType(e.doctype)) {
      issues.push({ kind: 'doctype', entity: e.id, doctype: e.doctype })
    } else {
      for (const f of e.fields || []) {
        if (!registry.isApprovedField(e.doctype, f)) {
          issues.push({ kind: 'field', entity: e.id, doctype: e.doctype, field: f })
        }
      }
    }
  }
  return issues
}

// Convert a real Frappe DocType export into registry seed format, so the mock
// registry can be reseeded with UCC's actual field list the moment someone
// provides an export — no bench required. Accepts the shapes Frappe actually
// produces: a single DocType doc, an array of them, or the {docs:[...]}
// wrapper from export_doc/data import.
const LAYOUT_FIELDTYPES = new Set([
  'Section Break', 'Column Break', 'Tab Break', 'HTML', 'Button', 'Fold', 'Heading',
])

export function seedFromFrappeExport(exported) {
  let docs = exported
  if (docs && !Array.isArray(docs) && Array.isArray(docs.docs)) docs = docs.docs
  if (!Array.isArray(docs)) docs = [docs]

  const seed = []
  for (const doc of docs) {
    if (!doc || doc.doctype !== 'DocType' || !doc.name) continue
    const fields = (doc.fields || [])
      .filter((f) => f.fieldname && !LAYOUT_FIELDTYPES.has(f.fieldtype))
      .map((f) => f.fieldname)
    // 'name' is always readable in Frappe but never listed as a docfield
    if (!fields.includes('name')) fields.unshift('name')
    seed.push({ doctype: doc.name, fields })
  }
  if (seed.length === 0) {
    throw new Error('no DocType documents found in this export (expected doctype: "DocType" entries)')
  }
  return seed
}

// A shared default instance for the Studio.
export const approvedRegistry = new MockApprovedRegistry()
