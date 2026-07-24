// Definition-driven resolution shared by the renderers. No hardcoded knowledge
// of any specific application — everything is read from the definition. Kept as
// plain JS so it is unit-testable without a browser.

// Which entity a component binds to: an explicit component.entity wins; else
// fall back to the first entity in the data model (skeletal example components
// carry only {id, type}, so a sensible default lets them still render).
export function resolveEntity(def, component) {
  const entities = def.data_model?.entities || []
  if (component?.entity) return entities.find((e) => e.id === component.entity) || entities[0] || null
  return entities[0] || null
}

// Columns / form fields come from the bound entity's declared field list.
export function fieldsOf(entity) {
  return entity?.fields || []
}

// Infer a widget for a bare field name (the schema stores only names). A
// `status` field becomes a select over the workflow's state labels; dates,
// attachments and the rest fall back by name convention. Relationship-aware:
// a field that is the source of a `link` relationship renders as a link select.
export function inferFieldType(def, entityId, field) {
  const f = field.toLowerCase()
  if (f === 'status') {
    const states = def.workflow?.states || []
    if (states.length) return { widget: 'select', options: states.map((s) => ({ value: s.id, label: s.label })) }
  }
  if (f.includes('date')) return { widget: 'date' }
  if (f.includes('file') || f.includes('attachment')) return { widget: 'attachment' }
  const rel = (def.data_model?.relationships || []).find(
    (r) => r.type === 'link' && r.source === entityId && (r.id === field || f.includes('link')),
  )
  if (rel) return { widget: 'link', target: rel.target }
  return { widget: 'text' }
}

// Dashboard metrics for an entity: total plus a status breakdown when the
// entity has a status field.
export function computeMetrics(rows, entity) {
  const metrics = [{ label: 'Total', value: rows.length }]
  if ((entity?.fields || []).includes('status')) {
    const by = {}
    for (const r of rows) by[r.status] = (by[r.status] || 0) + 1
    for (const [status, count] of Object.entries(by)) metrics.push({ label: status, value: count })
  }
  return metrics
}

// Transitions available from a record's current state, for the given role
// (null role = show all). Drives both workflow_history display and execution.
export function availableTransitions(def, currentStateId, role = null) {
  return (def.workflow?.transitions || []).filter(
    (t) => t.from === currentStateId && (role == null || t.role === role),
  )
}
