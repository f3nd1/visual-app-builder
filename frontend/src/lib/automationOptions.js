// Option sources for bound automation parameters. Each returns strings drawn
// from data the Studio already holds; a param with a `source` renders as a
// dropdown of these, otherwise it stays free text. The stored value is always
// the plain string, so definition_json is unchanged (UI-only improvement).

const distinct = (xs) => [...new Set(xs.filter(Boolean))]

export function optionsFor(def, source) {
  switch (source) {
    case 'entity':
      return (def.data_model?.entities || []).map((e) => e.id)
    case 'field':
      // no entity context in an automation param, so offer every field name
      return distinct((def.data_model?.entities || []).flatMap((e) => e.fields || []))
    case 'notification':
      return (def.notifications || []).map((n) => n.id)
    case 'role':
      return distinct([
        ...(def.permissions || []).map((p) => p.role),
        ...(def.workflow?.transitions || []).map((t) => t.role),
      ])
    default:
      return []
  }
}
