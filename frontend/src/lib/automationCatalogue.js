// The fixed Phase-1 automation catalogue from docs/MVP_SCOPE.md. Each entry
// carries its parameter schema so the form editor is data-driven. Stored shape
// per automation is exactly the schema's { id, trigger, conditions, actions }
// with each part an object { type, ...params } — flat, not a branching graph,
// but already graph-shaped so a later node-canvas editor loads it unchanged.

// param.source (optional) names a bound option set from automationOptions.js;
// params without a source stay free text (e.g. a literal comparison value).
export const TRIGGERS = {
  record_created: { label: 'Record created', params: [] },
  record_submitted: { label: 'Record submitted', params: [] },
  field_changed: { label: 'Field changed', params: [{ key: 'field', label: 'Field', source: 'field' }] },
  due_date_reached: { label: 'Due date reached', params: [{ key: 'field', label: 'Date field', source: 'field' }] },
  scheduled_daily: { label: 'Scheduled daily check', params: [] },
}

export const CONDITIONS = {
  field_equals: { label: 'Field equals value', params: [{ key: 'field', label: 'Field', source: 'field' }, { key: 'value', label: 'Value' }] },
  field_empty: { label: 'Field is empty', params: [{ key: 'field', label: 'Field', source: 'field' }] },
  date_overdue: { label: 'Date is overdue', params: [{ key: 'field', label: 'Date field', source: 'field' }] },
  checklist_complete: { label: 'All checklist items complete', params: [] },
  user_has_role: { label: 'User has role', params: [{ key: 'role', label: 'Role', source: 'role' }] },
  related_record_exists: { label: 'Related record exists', params: [{ key: 'entity', label: 'Entity', source: 'entity' }] },
}

export const ACTIONS = {
  create_record: { label: 'Create record', params: [{ key: 'entity', label: 'Entity', source: 'entity' }] },
  update_field: { label: 'Update field', params: [{ key: 'field', label: 'Field', source: 'field' }, { key: 'value', label: 'Value' }] },
  assign_user: { label: 'Assign user', params: [{ key: 'user', label: 'User / role' }] },
  send_email: { label: 'Send email', params: [{ key: 'notification', label: 'Notification id', source: 'notification' }] },
  send_system_notification: { label: 'Send system notification', params: [{ key: 'notification', label: 'Notification id', source: 'notification' }] },
  request_approval: { label: 'Request approval', params: [{ key: 'role', label: 'Approver role', source: 'role' }] },
  create_quality_action: { label: 'Create Quality Action', params: [] },
  block_submission: { label: 'Block submission with message', params: [{ key: 'message', label: 'Validation message' }] },
}
