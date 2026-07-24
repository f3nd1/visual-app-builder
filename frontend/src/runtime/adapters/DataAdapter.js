// The one interface the Runtime is allowed to call for data and permissions.
// Everything is async because the real implementation (FrappeDataAdapter) will
// make REST calls — writing the Runtime against promises now means the future
// swap is a drop-in, not a rewrite. The Runtime must NEVER reach past this
// interface to fixtures or Frappe internals directly.
//
// action: 'read' | 'write' | 'create' | 'submit'
// entityId: a data_model entity id from the definition (NOT the DocType name).

function notImpl(name) {
  return new Error(`DataAdapter.${name} not implemented — use a concrete adapter (MockDataAdapter / FrappeDataAdapter)`)
}

export class DataAdapter {
  // Return one record by its primary key (Frappe `name`), or null.
  async getRecord(_entityId, _name) {
    throw notImpl('getRecord')
  }

  // Return an array of records. opts: { filters?: {field: value}, limit?: number }.
  async listRecords(_entityId, _opts = {}) {
    throw notImpl('listRecords')
  }

  // Create a record from partial data; return the created record (with `name`).
  async createRecord(_entityId, _data) {
    throw notImpl('createRecord')
  }

  // Apply a partial patch to a record; return the updated record.
  async updateRecord(_entityId, _name, _patch) {
    throw notImpl('updateRecord')
  }

  // True if `user` may perform `action` on `entityId`. Delegated to the
  // permission adapter in the mock; a real check in Frappe.
  async checkPermission(_entityId, _action, _user) {
    throw notImpl('checkPermission')
  }
}
