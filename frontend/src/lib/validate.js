// Continuous validation for the Studio.
//
// Two layers, both required by the task:
//   1. Structural JSON-Schema validation against the REAL schema file
//      (schemas/application-definition.schema.json), via ajv.
//   2. Cross-reference / uniqueness checks that the schema cannot express but
//      scripts/check_repository.py enforces: IDs unique across sections, and
//      workflow transitions referencing known states.
//
// Anything passing both layers passes check_repository.py, so a Studio export
// round-trips through the repo's own validator unchanged.

import Ajv2020 from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'
import schema from '../../../schemas/application-definition.schema.json'

const ajv = new Ajv2020({ allErrors: true, strict: false })
addFormats(ajv)
const validateSchema = ajv.compile(schema)

// Mirrors check_repository.py: these sections share one id namespace.
const ID_SECTIONS = [
  ['pages', (d) => d.pages],
  ['entities', (d) => d.data_model?.entities],
  ['states', (d) => d.workflow?.states],
  ['transitions', (d) => d.workflow?.transitions],
  ['automations', (d) => d.automations],
  ['notifications', (d) => d.notifications],
  ['tests', (d) => d.tests],
]

// Returns a flat array of { path, message } issues. Empty array === valid.
export function validateDefinition(def) {
  const issues = []

  if (!validateSchema(def)) {
    for (const e of validateSchema.errors || []) {
      issues.push({
        path: e.instancePath || '/',
        message: `${e.instancePath || 'root'} ${e.message}`.trim(),
      })
    }
  }

  // --- checks beyond the schema (parity with check_repository.py) ---
  const seen = new Set()
  for (const [section, pick] of ID_SECTIONS) {
    for (const item of pick(def) || []) {
      const id = item?.id
      if (!id) {
        issues.push({ path: `/${section}`, message: `item in ${section} has no id` })
      } else if (seen.has(id)) {
        issues.push({ path: `/${section}`, message: `duplicate id "${id}"` })
      } else {
        seen.add(id)
      }
    }
  }

  const stateIds = new Set((def.workflow?.states || []).map((s) => s.id))
  for (const t of def.workflow?.transitions || []) {
    if (!stateIds.has(t.from)) {
      issues.push({ path: '/workflow/transitions', message: `transition "${t.id}" has unknown from state "${t.from}"` })
    }
    if (!stateIds.has(t.to)) {
      issues.push({ path: '/workflow/transitions', message: `transition "${t.id}" has unknown to state "${t.to}"` })
    }
  }

  return issues
}

export { schema }
