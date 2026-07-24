// Simulates ERPNext role-based permission checks from the definition's
// `permissions` array. A user may perform an action on an entity if any of the
// user's roles has that action granted for that entity. System Manager is
// treated as a superuser (ERPNext convention), so it is allowed regardless.
//
// A real FrappePermissionAdapter replaces this with frappe.has_permission /
// the session's actual roles — same can() surface, no Runtime changes.
import { PermissionAdapter } from './PermissionAdapter.js'

export class MockPermissionAdapter extends PermissionAdapter {
  constructor(def) {
    super()
    this.def = def
  }

  can(entityId, action, user) {
    if (!user) return false // no session -> no access (harness always sets one)
    const roles = user.roles || []
    if (roles.includes('System Manager')) return true
    return (this.def.permissions || []).some(
      (p) => p.entity === entityId && roles.includes(p.role) && !!p[action],
    )
  }
}
