// Data-driven Component Registry (architecture decision: component types are
// registered once — type name -> configurable-property schema -> renderer
// reference — not hardcoded per type in the runtime).
//
// The Studio uses `props` to render the inspector generically and `defaults`
// to seed a new instance. `renderer` names the Runtime component that will
// draw it later (the Runtime bundle is out of scope this session, but the
// reference is recorded now so the two stay in sync).
//
// Only the ~6 types QA Lifecycle Manager needs are registered. Adding a type
// is a new entry here — no core change — which is the whole point of the
// registry pattern.

// prop.kind: text | select | entity | field | bool | condition
export const COMPONENT_TYPES = {
  // --- Data category ---
  record_list: {
    label: 'Record List',
    category: 'Data',
    icon: '≣',
    renderer: 'RecordList',
    props: [
      { key: 'title', kind: 'text', label: 'Title' },
      { key: 'entity', kind: 'entity', label: 'Entity' },
    ],
    defaults: { title: 'Records' },
  },
  record_form: {
    label: 'Record Form',
    category: 'Data',
    icon: '▤',
    renderer: 'RecordForm',
    props: [
      { key: 'title', kind: 'text', label: 'Title' },
      { key: 'entity', kind: 'entity', label: 'Entity' },
    ],
    defaults: { title: 'Details' },
  },
  workflow_history: {
    label: 'Workflow History',
    category: 'Data',
    icon: '⟲',
    renderer: 'WorkflowHistory',
    props: [{ key: 'title', kind: 'text', label: 'Title' }],
    defaults: { title: 'History' },
  },
  metric_group: {
    label: 'Metric Group',
    category: 'Dashboard',
    icon: '▦',
    renderer: 'MetricGroup',
    props: [
      { key: 'title', kind: 'text', label: 'Title' },
      { key: 'entity', kind: 'entity', label: 'Entity' },
    ],
    defaults: { title: 'Summary' },
  },
  checklist: {
    label: 'Checklist',
    category: 'Dashboard',
    icon: '☑',
    renderer: 'Checklist',
    props: [
      { key: 'title', kind: 'text', label: 'Title' },
      { key: 'entity', kind: 'entity', label: 'Entity' },
    ],
    defaults: { title: 'Checklist' },
  },

  // --- Fields category (basic field types) ---
  text_field: {
    label: 'Text', category: 'Fields', icon: 'T', renderer: 'FieldText',
    props: fieldProps(), defaults: { label: 'Text' },
  },
  select_field: {
    label: 'Select', category: 'Fields', icon: '⌄', renderer: 'FieldSelect',
    props: fieldProps(), defaults: { label: 'Select' },
  },
  date_field: {
    label: 'Date', category: 'Fields', icon: '☷', renderer: 'FieldDate',
    props: fieldProps(), defaults: { label: 'Date' },
  },
  link_field: {
    label: 'Link', category: 'Fields', icon: '⇔', renderer: 'FieldLink',
    props: fieldProps(), defaults: { label: 'Link' },
  },
  attachment_field: {
    label: 'Attachment', category: 'Fields', icon: '📎', renderer: 'FieldAttachment',
    props: fieldProps(), defaults: { label: 'Attachment' },
  },
}

// Shared inspector schema for the basic field types: bound to an entity field,
// with a label and a required flag.
function fieldProps() {
  return [
    { key: 'label', kind: 'text', label: 'Label' },
    { key: 'entity', kind: 'entity', label: 'Entity' },
    { key: 'field', kind: 'field', label: 'Field' },
    { key: 'required', kind: 'bool', label: 'Required' },
  ]
}

// Palette grouped by category, preserving registry order.
export function paletteByCategory() {
  const groups = {}
  for (const [type, def] of Object.entries(COMPONENT_TYPES)) {
    ;(groups[def.category] ||= []).push({ type, ...def })
  }
  return groups
}

export const FIELD_TYPES = Object.keys(COMPONENT_TYPES).filter(
  (t) => COMPONENT_TYPES[t].category === 'Fields',
)

// The type a dragged data-model field becomes by default.
export const DEFAULT_FIELD_COMPONENT = 'text_field'
