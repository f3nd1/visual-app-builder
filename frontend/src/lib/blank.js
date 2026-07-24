// A minimal empty definition in the exact schema shape. Every top-level key
// the schema requires is present so validation has something concrete to
// report against from the very first render.
export function blankDefinition() {
  return {
    schema_version: '0.1',
    application: {
      code: 'new_application',
      title: 'New Application',
      description: '',
      status: 'draft',
      version: '0.1.0',
    },
    pages: [],
    data_model: { entities: [], relationships: [] },
    workflow: { states: [], transitions: [] },
    automations: [],
    permissions: [],
    translations: {},
    notifications: [],
    tests: [],
  }
}
