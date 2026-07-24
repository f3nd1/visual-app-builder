# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Objective

Build Visual App Builder as a separate Frappe app installed inside an existing ERPNext/SMS site.

The product should allow authorised non-developers to visually define record-based and workflow-based applications. The first applications are QA Lifecycle Manager, Document Control Manager and Learning Material Vetting Manager.

## What exists today

Two working parts, plus the definition contract that binds them:

- **`frontend/`** — a complete, tested Vue 3 + Vite app: the **Studio** (design-time builder, `src/`) and the **Runtime** (staff-facing renderer, `src/runtime/`), two separate bundles. The whole designer→user pipeline works in-browser against mocks. No backend. See "Frontend architecture" below.
- **`scripts/check_repository.py`** — validates required files exist and validates every `examples/*.json` (required top-level keys, `schema_version` "0.1", unique stable IDs across sections, workflow transitions referencing known states). Single source of the Python validation logic; `tests/test_definitions.py` imports it. Note it is a **subset** of the frontend's ajv schema check — it does not run JSON Schema.
- **`examples/*.json`** — one definition per demo app, conforming to `schemas/application-definition.schema.json` and `docs/DEFINITION_MODEL.md`. These also **seed** the Studio's mock Approved DocType Registry and the Runtime's synthetic data.
- **`prototype/visual_app_builder_prototype.html`** — standalone visual reference only; superseded by the real Studio (D-009). Do not extend it.

**Everything backend is deferred** (needs a Frappe bench / Docker, unavailable here) and tracked in `docs/KNOWN_GAPS.md`. `frappe_app/` is still a placeholder for the eventual `bench new-app`.

## Definition model in brief

Each application is one versioned JSON document with top-level sections: `application`, `pages`, `data_model`, `workflow`, `automations`, `permissions`, `translations`, `notifications`, `tests`. IDs (pages, entities, states, transitions, automations, notifications, tests) are stable and unique across the document. Lifecycle: Draft → Technical Review → UAT → Approved → Published → Archived; published versions are immutable, changes create a new version. Full details in `docs/DEFINITION_MODEL.md`.

## Read first

Before changing code, read:

1. `README.md`
2. `docs/DECISIONS.md` (D-001..D-010 — the binding decisions)
3. `docs/ARCHITECTURE.md`
4. `docs/MVP_SCOPE.md`
5. `docs/KNOWN_GAPS.md` — the single current list of what is mock vs. deferred, and what each mock's real replacement is
6. `docs/RUNTIME_ADAPTERS.md` — method-level spec for the real Frappe adapters
7. the relevant file under `requirements/`

## Frontend architecture (the part with code)

The Studio and Runtime never share component code — they share the **definition**. Read these together to get the big picture:

- **Schema-lock** is the core invariant. `src/store.js`'s state *is* the definition document in exact `schemas/application-definition.schema.json` shape — no internal model, no mapping layer. Load = `JSON.parse`, export = `JSON.stringify`. Every edit is continuously validated (`src/lib/validate.js`: ajv against the real schema file + a JS port of check_repository.py's cross-section/transition rules). `npm run roundtrip` proves a Studio export passes the real `check_repository.py` byte-identical. **Never change `definition_json`'s shape** without updating schema + validator + `docs/DEFINITION_MODEL.md` + all three examples together.
- **Adapter pattern** isolates every backend-dependent behavior behind a base interface + `Mock*` implementation, so the real Frappe version is a drop-in: `DataAdapter`/`MockDataAdapter`, `PermissionAdapter`/`MockPermissionAdapter` (`src/runtime/adapters/`), `ApprovedRegistry`/`MockApprovedRegistry` (`src/lib/approvedRegistry.js`), and `MockPublicationStore` (`src/lib/publicationStore.js`). The Runtime engines (`src/runtime/engine/`) only ever call these interfaces.
- **The pipeline**: Studio *Publish* (gated on schema validity + registry cleanliness) → `MockPublicationStore` (versioned, checksummed, immutable, localStorage) → Runtime reads the published version. Studio (`index.html`) and Runtime (`runtime.html`) are separate bundles sharing that store via localStorage on the same origin.
- **Data-driven registries**: component types live in `src/lib/componentRegistry.js` (type → props schema → renderer ref), automation catalogue in `src/lib/automationCatalogue.js`. Add a type = a registry entry, not a core change.
- **Studio-only state stays out of the definition**: node canvas positions (`src/lib/layoutStore.js`) — the schema forbids extra keys on states, so layout is persisted separately.

Gotcha caught before: never `structuredClone` a Vue `reactive()` object (throws in-browser, not in Node tests) — definition data is JSON, so JSON-clone it.

## Non-negotiable architecture

- The builder and generated applications run inside ERPNext/Frappe.
- Use existing ERPNext permissions for read and write access.
- Store applications as versioned definitions.
- Use one shared runtime for ordinary generated applications.
- Do not generate a large custom Python/JavaScript implementation for every app.
- AI may propose definitions, but must not publish or execute unrestricted code.
- Development and UAT must not occur on the production SMS site.
- Published versions must be immutable and reversible.
- Keep aggregate visibility separate from record-level access.

## Implementation order

1. Confirm the actual Frappe and ERPNext versions.
2. Generate the real Frappe app with `bench new-app visual_app_builder` in the target bench.
3. Copy the relevant repository documentation into the generated app repository.
4. Implement the definition DocTypes and version storage.
5. Implement a small shared runtime.
6. Implement QA Lifecycle Manager only.
7. Complete tests and UAT.
8. Reuse the runtime for Document Control and Material Vetting.
9. Add advanced node editing and file generation only after the runtime is proven.

## Phase 1 supported features

- pages and sections;
- text, select, date, link, attachment and child-table fields;
- lists, forms, checklists and simple dashboards;
- approved DocType relationships;
- workflow states and transitions;
- simple trigger, condition and action automations;
- role-based visibility and editability;
- email and system notification templates;
- translations;
- test cases, UAT and publication.

Do not add unrestricted SQL, arbitrary Python execution, a generic join builder or automatic production publication in Phase 1.

## Coding approach

- Make small, verifiable changes.
- Prefer the simplest implementation that proves the shared-runtime model.
- Do not refactor unrelated code.
- Add or update tests with each behaviour change.
- State assumptions when the installed Frappe version or site configuration is unknown.
- Use stable IDs for applications, pages, components, nodes, edges and fields.
- Validate all saved definitions on the server.

## Verification commands

Repo root (Python, stdlib only — no packages needed):

```bash
python3 scripts/check_repository.py
python3 -m unittest discover -s tests -v
python3 -m unittest tests.test_definitions.DefinitionTests.test_all_example_definitions_are_valid -v   # single test
```

Frontend (run inside `frontend/`, after `npm install`):

```bash
npm test            # Vitest unit suite
npm run test:runtime  # runtime subset only
npx vitest run test/publicationStore.test.js   # single test file
npm run test:e2e    # Playwright (Studio + Runtime), uses pre-installed Chromium
npm run roundtrip   # exports a Studio definition, validates it with the real check_repository.py
npm run build       # builds BOTH bundles (index.html Studio + runtime.html Runtime)
npm run dev         # dev server; Studio at /, Runtime harness at /runtime.html
```

The full green bar across all of the above (plus byte-identical round-trip) is the definition-of-done every session has held to. If you change the definition format, update `scripts/check_repository.py`, `schemas/application-definition.schema.json`, `src/lib/validate.js`'s parity checks, `docs/DEFINITION_MODEL.md` and all three `examples/*.json` together — the checks fail otherwise.

Playwright note: this environment ships Chromium at `/opt/pw-browsers`; `playwright.config.js` pins `executablePath` — do not run `playwright install`.

## Where to continue

The Phase 1 frontend skeleton (design → publish → render list/record → enforce permissions → move through workflow → record UAT → publish immutable version) is **done, in mock**. The next work is the real Frappe backend — see `docs/KNOWN_GAPS.md` for the ranked list and each mock's drop-in replacement. That work needs a bench (Docker/OrbStack) and starts with the Implementation order above.
