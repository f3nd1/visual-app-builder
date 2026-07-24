// Permission interface, separate from data so a real ERPNext permission check
// is a drop-in replacement. action: 'read' | 'write' | 'create' | 'submit'.
export class PermissionAdapter {
  // True if `user` may perform `action` on entity `entityId`.
  can(_entityId, _action, _user) {
    throw new Error('PermissionAdapter.can not implemented')
  }
}
