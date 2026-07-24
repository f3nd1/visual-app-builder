# Runtime adapters — handoff spec for the real ERPNext connection

The Runtime (in `frontend/src/runtime/`) renders and operates applications purely
from `definition_json`, and reaches all data and permission decisions through two
interfaces. This session implemented **mock** adapters against synthetic data. To
connect the Runtime to a real ERPNext/Frappe site, implement two replacements —
`FrappeDataAdapter` and `FrappePermissionAdapter` — with the same signatures. No
Runtime component or engine changes; it only ever calls these interfaces.

Everything is **async** (returns a Promise) already, so real REST/RPC calls drop
in without touching call sites.

## Entity id → DocType

The Runtime addresses data by **entity id** (the `data_model.entities[].id` in the
definition), never by DocType name. Map it via the definition:

```
entity = def.data_model.entities.find(e => e.id === entityId)
doctype = entity.doctype        // the real Frappe DocType
fields  = entity.fields         // the fields the app may read/write
```

A real adapter is constructed with the definition, so it can build this map once.

## 1. DataAdapter

Source of the interface: `frontend/src/runtime/adapters/DataAdapter.js`. Records are
plain JSON objects with a Frappe-style primary key field `name`. Lists are arrays
of such objects.

| Method | Signature | Returns | Frappe implementation |
|---|---|---|---|
| `getRecord` | `(entityId, name)` | one record object, or `null` | `frappe.client.get` / `frappe.db.get_doc(doctype, name)`; return `null` on not-found rather than throwing |
| `listRecords` | `(entityId, { filters?, limit? })` | array of records | `frappe.client.get_list(doctype, { filters, fields: entity.fields + ['name'], limit_page_length: limit })` |
| `createRecord` | `(entityId, data)` | the created record (with assigned `name`) | `frappe.client.insert({ doctype, ...data })`; let Frappe assign `name` |
| `updateRecord` | `(entityId, name, patch)` | the updated record | `frappe.client.set_value(doctype, name, patch)` (or get→update→save); return the fresh doc |
| `checkPermission` | `(entityId, action, user)` | boolean | delegate to the PermissionAdapter (below); do NOT reimplement here |

Contract notes the mock already honours and a real adapter must keep:
- **Return copies, not live references.** REST naturally does this; if you cache,
  clone before returning so callers can't mutate server state in place.
- **`action` values** are exactly `'read' | 'write' | 'create' | 'submit'`.
- **Unknown entity** should throw (the mock throws `unknown entity: <id>`); a
  missing *record* returns `null`, it does not throw.

## 2. PermissionAdapter

Source: `frontend/src/runtime/adapters/PermissionAdapter.js`.

| Method | Signature | Returns | Frappe implementation |
|---|---|---|---|
| `can` | `(entityId, action, user)` | boolean | `frappe.has_permission(doctype, ptype=action, user=user.name)`; or resolve the session roles and check DocPerms. May be async in the real version. |

The mock derives grants from the definition's `permissions` array and treats
`System Manager` as a superuser. The real adapter should defer to ERPNext's own
permission system (decision D-003: the Runtime does not invent access — it
inherits ERPNext permissions). The definition's `permissions` array is what the
**publication** step should have written into real DocType permissions; at
runtime, trust Frappe's check, not the JSON.

## 3. Mock behaviours that are PLACEHOLDERS (must become real)

These are deliberately faked in this session and must be replaced when the backend
exists. Each is marked in code with the reasoning.

| Area | Mock behaviour | What real must do |
|---|---|---|
| **Synthetic data** | `MockDataAdapter` fabricates rows (`fixtures/synthetic.js`) | Real reads from the site; delete the fixtures dependency |
| **Email / system notification actions** | `automation.js` logs `"[stub] would send_email …"` | Send via Frappe Notification / `frappe.sendmail`, using the definition's `notifications[]` templates |
| **`request_approval` / `create_quality_action` / `block_submission`** | logged only | Real approval routing; create the real Quality Action DocType; actually abort the save with a validation error |
| **Time-based triggers** (`due_date_reached`, `scheduled_daily`) | inert in the interactive engine (`triggerMatches` returns false) | Wire to Frappe scheduler events / `frappe.utils` cron; the automation defs already carry them |
| **`checklist_complete` condition** | assumed true (no checklist data in mock) | Evaluate against real checklist child-table data |
| **Workflow execution** | `workflow.js` sets a `status` field directly via `updateRecord` | Prefer a real Frappe **Workflow** document (states/transitions generated from the definition) and `frappe.model.workflow.apply_workflow`, so transitions honour Frappe's own workflow engine, docstatus and audit trail. `submit` action must map to Frappe docstatus submission. |
| **Immutability** | not enforced at runtime | Published `Visual Application Version` rows are immutable (decision D-002 / DEFINITION_MODEL.md); the real data layer must refuse writes that would mutate a published definition |
| **Permission superuser** | `System Manager` bypass hardcoded | Confirm this matches the site's actual role model; prefer `frappe.has_permission` over a hardcoded bypass |

## 4. Wiring the swap

Only the harness (`RuntimeHarness.vue`) constructs adapters:

```js
const perms   = new MockPermissionAdapter(def)
const adapter = new MockDataAdapter(def, { permissionAdapter: perms })
const ctx     = createRuntimeContext(def, { adapter, user })
```

In production, construct `FrappeDataAdapter` / `FrappePermissionAdapter` instead and
pass the real session user. Everything downstream — `RuntimePage`, `ListRenderer`,
`FormRenderer`, `WorkflowHistory`, the workflow and automation engines — is
unchanged.

## 5. Verifying the real adapters

The Runtime unit suite (`test/runtime/`) tests the engines against the mock. A
`FrappeDataAdapter` should be validated the same way against a **development** site
(never production/SMS — decision D-006), asserting the same `getRecord` / `listRecords`
/ `createRecord` / `updateRecord` contract shapes documented above.
