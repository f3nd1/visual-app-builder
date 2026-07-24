// Workflow transition execution against the mock data. A transition is allowed
// when the record is in the transition's `from` state and the user holds the
// transition's role (System Manager bypasses, ERPNext convention). Executing it
// updates the record's `status` field via the DataAdapter.
//
// Reads purely from definition_json (workflow.states / workflow.transitions),
// matching the shape the Studio produces.

export function canTransition(def, user, transition, record) {
  if (!record) return { ok: false, reason: 'no record' }
  if (record.status !== transition.from) {
    return { ok: false, reason: `record is not in state "${transition.from}"` }
  }
  const roles = user?.roles || []
  if (!roles.includes('System Manager') && !roles.includes(transition.role)) {
    return { ok: false, reason: `requires role "${transition.role}"` }
  }
  return { ok: true }
}

// Execute a transition; returns { record, event } where event feeds automations
// (a status change is a field_changed event). Throws if not allowed.
export async function executeTransition(ctx, entityId, recordName, transition) {
  const record = await ctx.adapter.getRecord(entityId, recordName)
  const check = canTransition(ctx.def, ctx.user, transition, record)
  if (!check.ok) throw new Error(check.reason)
  // Role gate alone is not enough: a transition writes the record, so the user
  // must also hold write permission on the entity (the renderers only gate UI;
  // this is the choke point every transition routes through).
  if (!(await ctx.can(entityId, 'write'))) {
    throw new Error(`no write permission on "${entityId}"`)
  }
  const updated = await ctx.adapter.updateRecord(entityId, recordName, { status: transition.to })
  return {
    record: updated,
    event: { type: 'field_changed', entityId, record: updated, changedField: 'status' },
  }
}
