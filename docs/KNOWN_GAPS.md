# Known gaps — what's still deferred to the Mac/OrbStack session

Single current record of everything not yet real, so a future session doesn't
have to rediscover gaps by re-reading the code. For the exact method
signatures/return shapes a real adapter must implement, see
`docs/RUNTIME_ADAPTERS.md` (not repeated here).

## Where things stand

- **Frontend is complete and tested**: Studio (design) + Runtime (renderer), 84
  unit tests, 13 Playwright e2e, schema-locked (round-trip verified).
- **The designer→user pipeline works today, in mock**: design in Studio →
  Publish → run the published version in Runtime, all client-side.
- **Everything backend is deferred** — it needs a Frappe bench (Docker/OrbStack/
  MariaDB), which this environment does not have.

## Closed since RUNTIME_ADAPTERS.md was written

| Gap | Now (mock) | File |
|---|---|---|
| Approved DocType/field whitelist (D-004) | `MockApprovedRegistry`, seeded from the examples; Data Model editor gates DocType/field choices; publish blocked on violations | `src/lib/approvedRegistry.js` |
| Publication / immutable versioning / rollback | `MockPublicationStore` — versions, checksum, immutability, rollback; Studio Publish → Runtime reads it | `src/lib/publicationStore.js` |

## Deferred to the real backend (each mock → its real replacement)

All mocks share the adapter pattern (base interface + Mock impl), so each is a
drop-in swap, not a rewrite.

| # | Deferred item | Replaces mock | Notes / cross-ref |
|---|---|---|---|
| 1 | Frappe app scaffold (`bench new-app`) + install on a dev site | — | needs OrbStack; not this environment |
| 2 | DocTypes: Visual Application, Visual Application Version, Approved DocType Registry (+ Approved Field), Component Registry, Automation Rule (+ Condition/Action), Test Case (+ Test Step), Visual App UAT Run, Deployment Log | — | see `docs/ARCHITECTURE.md` production shape |
| 3 | `FrappeDataAdapter` (real REST reads/writes) | `MockDataAdapter` | RUNTIME_ADAPTERS.md §1 |
| 4 | `FrappePermissionAdapter` (ERPNext `has_permission`) | `MockPermissionAdapter` | RUNTIME_ADAPTERS.md §2; decision D-003 |
| 5 | `FrappeApprovedRegistry` (reads the real Approved DocType Registry DocType) | `MockApprovedRegistry` | same interface: `listDocTypes/isApprovedDocType/approvedFields/isApprovedField` |
| 6 | Real publication on `Visual Application Version` (DB-level immutability, approval + sign-off, deployment log) | `MockPublicationStore` | same interface: `publish/listVersions/getActive/rollback`; decision D-002 |
| 7 | Real workflow execution via native Frappe **Workflow** (docstatus, submit, audit trail) | `engine/workflow.js` direct status write | RUNTIME_ADAPTERS.md §3 |
| 8 | Real email / system notifications | automation `send_email`/`send_system_notification` stubs (log only) | RUNTIME_ADAPTERS.md §3 |
| 9 | Time-based automation triggers (`due_date_reached`, `scheduled_daily`) via Frappe scheduler | inert in `engine/automation.js` | RUNTIME_ADAPTERS.md §3 |
| 10 | Action semantics: `request_approval`, `create_quality_action`, `block_submission` | logged stubs | RUNTIME_ADAPTERS.md §3 |
| 11 | `checklist_complete` condition against real checklist data | assumed true | RUNTIME_ADAPTERS.md §3 |
| 12 | Server-side definition validation hook (port `check_repository.py` + registry check into a Frappe `validate`) | client-side `validate.js` + `registryIssues` | keep the JS as the shared source of truth. NOTE: `check_repository.py` is a strict SUBSET of the ajv validation (stdlib-only — no JSON-schema check, so it accepts e.g. transitions missing `action`/`role` that ajv rejects); the server hook must run the FULL schema, not just port the python checks |
| 13 | AI-assisted definition drafting | never built | out of scope every session so far; propose-only, never auto-publish/execute (D-004) |
| 14 | Studio + Runtime delivered as Frappe Desk pages / bundled into the app | standalone Vite bundles | two separate bundles today (index.html, runtime.html) |
| 15 | Install-day mapping of `quality_action` | `MockDataAdapter` fabricates rows for it like any entity | the QA example marks it `mode: "existing"` deliberately — it references UCC's REAL Quality Action DocType. The install step must map it in the Approved DocType Registry, never create a colliding new DocType |

## Invariant every future session must preserve

`definition_json`'s schema shape is frozen (`schemas/application-definition.schema.json`).
The Studio round-trip test (`npm run roundtrip`) plus `check_repository.py` must
stay green through all of the above. If the schema must change, that is a
deliberate versioned decision, not a side effect — update the schema, the
validator, `docs/DEFINITION_MODEL.md`, and all three examples together.
