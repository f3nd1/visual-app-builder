// Mocks the core behaviour of the future "Visual Application Version" DocType:
// takes a Studio export, assigns a sequential version, computes a checksum,
// marks it the active published version for its application_code, and persists
// it (localStorage in the browser, in-memory in Node — same approach as
// layoutStore.js). Published versions are IMMUTABLE: publishing again always
// creates a new version and never overwrites an existing one. Rollback just
// re-points `active` at a prior version.
//
// Definition JSON is stored verbatim — this never changes its shape.

import { reactive, watch } from 'vue'

const KEY = 'vab-publications'

// djb2 — a tiny deterministic content hash (no crypto dependency needed for a
// mock checksum). Real Frappe would use its own version checksum.
export function checksum(str) {
  let h = 5381
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0
  return h.toString(16).padStart(8, '0')
}

const clone = (x) => JSON.parse(JSON.stringify(x))

function hasLS() {
  try { return typeof localStorage !== 'undefined' && localStorage !== null } catch { return false }
}

export class MockPublicationStore {
  // persist=true wires the shared app instance to localStorage; tests construct
  // with persist=false for isolation.
  constructor({ persist = false } = {}) {
    this.persist = persist && hasLS()
    // { [appCode]: { title, active: versionNumber, versions: [{version, checksum, definition, publishedAt}] } }
    this.state = reactive({ apps: this.persist ? load() : {} })
    if (this.persist) {
      watch(() => this.state.apps, (v) => save(v), { deep: true })
      // Studio and Runtime are separate bundles sharing this store through
      // localStorage; without this, a tab open during a publish in another tab
      // reads stale state forever. The 'storage' event fires only in OTHER
      // tabs, so re-reading here cannot loop with the watch above.
      // ponytail: whole-state replace, last-writer-wins on concurrent edits —
      // fine for a mock; the real backend (DocType) replaces this store.
      if (typeof window !== 'undefined') {
        window.addEventListener('storage', (e) => {
          if (e.key !== KEY) return
          const fresh = load()
          for (const k of Object.keys(this.state.apps)) if (!(k in fresh)) delete this.state.apps[k]
          Object.assign(this.state.apps, fresh)
        })
      }
    }
  }

  // Publish a Studio export. Always a NEW version; the active one is never
  // overwritten. Returns { appCode, version, checksum }.
  publish(def, at = null) {
    const appCode = def.application?.code
    if (!appCode) throw new Error('cannot publish: application.code is required')
    const entry = (this.state.apps[appCode] ||= { title: '', active: null, versions: [] })
    entry.title = def.application.title || appCode
    const version = entry.versions.length + 1
    const stored = clone(def)
    entry.versions.push({
      version,
      checksum: checksum(JSON.stringify(def)),
      definition: stored,
      publishedAt: at,
    })
    entry.active = version
    return { appCode, version, checksum: entry.versions[version - 1].checksum }
  }

  listApplications() {
    return Object.entries(this.state.apps).map(([appCode, e]) => ({
      appCode,
      title: e.title,
      active: e.active,
      versionCount: e.versions.length,
    }))
  }

  listVersions(appCode) {
    const e = this.state.apps[appCode]
    if (!e) return []
    return e.versions.map((v) => ({
      version: v.version,
      checksum: v.checksum,
      publishedAt: v.publishedAt,
      active: v.version === e.active,
    }))
  }

  getActive(appCode) {
    const e = this.state.apps[appCode]
    if (!e || e.active == null) return null
    return this._read(e, e.active)
  }

  getVersion(appCode, version) {
    const e = this.state.apps[appCode]
    if (!e) return null
    return this._read(e, version)
  }

  _read(entry, version) {
    const v = entry.versions.find((x) => x.version === version)
    if (!v) return null
    // return a clone so callers can never mutate a published (immutable) version
    return { version: v.version, checksum: v.checksum, definition: clone(v.definition) }
  }

  // Rollback: mark a prior version active again (does not create a new version).
  rollback(appCode, version) {
    const e = this.state.apps[appCode]
    if (!e) throw new Error(`no such application: ${appCode}`)
    if (!e.versions.some((v) => v.version === version)) throw new Error(`no such version: ${version}`)
    e.active = version
    return this.getActive(appCode)
  }

  clear() {
    for (const k of Object.keys(this.state.apps)) delete this.state.apps[k]
  }
}

function load() {
  if (!hasLS()) return {}
  try { return JSON.parse(localStorage.getItem(KEY)) || {} } catch { return {} }
}
function save(apps) {
  try { localStorage.setItem(KEY, JSON.stringify(apps)) } catch { /* non-critical */ }
}

// Shared instance for Studio + Runtime (persisted, so it survives across the two
// separate bundles via localStorage on the same origin).
export const publicationStore = new MockPublicationStore({ persist: true })
