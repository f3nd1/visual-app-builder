// The sections that check_repository.py (and our validator) treat as ONE id
// namespace. A new id in any of these must be unique against all of them, not
// just its own section — otherwise a page and an entity sharing a stem would
// produce a cross-section duplicate.

export function checkedSectionIds(def) {
  const ids = []
  for (const p of def.pages || []) ids.push(p.id)
  for (const e of def.data_model?.entities || []) ids.push(e.id)
  for (const s of def.workflow?.states || []) ids.push(s.id)
  for (const t of def.workflow?.transitions || []) ids.push(t.id)
  for (const a of def.automations || []) ids.push(a.id)
  for (const n of def.notifications || []) ids.push(n.id)
  for (const t of def.tests || []) ids.push(t.id)
  return ids
}
