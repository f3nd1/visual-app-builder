// In-memory DataAdapter backed by synthetic fixtures. Built from a definition:
// every entity gets seed data (nice hand-written seed if available, else
// generated from the field list) so ANY definition — including a fresh Studio
// export — renders with data. Records are returned as clones, mirroring a REST
// API (callers can't mutate the store in place).
//
// A future FrappeDataAdapter implements the same DataAdapter surface with real
// REST calls; the Runtime code above it does not change.

import { DataAdapter } from './DataAdapter.js'
import { generateSynthetic, SEED_BY_APP } from '../fixtures/synthetic.js'

const clone = (x) => JSON.parse(JSON.stringify(x))

export class MockDataAdapter extends DataAdapter {
  constructor(def, { permissionAdapter = null, seed = null, count = 5 } = {}) {
    super()
    this.def = def
    this.perms = permissionAdapter
    this.store = {}
    this._seq = {}

    const appSeed = seed || SEED_BY_APP[def.application?.code] || {}
    for (const entity of def.data_model?.entities || []) {
      const rows = appSeed[entity.id] ? clone(appSeed[entity.id]) : generateSynthetic(entity, count)
      this.store[entity.id] = rows.map((r, i) => ({ name: r.name || this._mkName(entity.id, i + 1), ...r }))
      this._seq[entity.id] = this.store[entity.id].length
    }
  }

  _mkName(entityId, n) {
    return `${entityId.toUpperCase()}-${String(n).padStart(4, '0')}`
  }
  _rows(entityId) {
    if (!(entityId in this.store)) throw new Error(`unknown entity: ${entityId}`)
    return this.store[entityId]
  }

  async listRecords(entityId, { filters = null, limit = null } = {}) {
    let rows = this._rows(entityId)
    if (filters) {
      rows = rows.filter((r) => Object.entries(filters).every(([k, v]) => r[k] === v))
    }
    if (limit != null) rows = rows.slice(0, limit)
    return clone(rows)
  }

  async getRecord(entityId, name) {
    const r = this._rows(entityId).find((x) => x.name === name)
    return r ? clone(r) : null
  }

  async createRecord(entityId, data) {
    const name = data.name || this._mkName(entityId, ++this._seq[entityId])
    const rec = { name, ...data }
    this._rows(entityId).push(rec)
    return clone(rec)
  }

  async updateRecord(entityId, name, patch) {
    const r = this._rows(entityId).find((x) => x.name === name)
    if (!r) throw new Error(`no such record: ${entityId}/${name}`)
    Object.assign(r, patch)
    return clone(r)
  }

  async checkPermission(entityId, action, user) {
    // Delegate to the permission adapter when wired (step 3); until then allow.
    if (this.perms) return this.perms.can(entityId, action, user)
    return true
  }
}
