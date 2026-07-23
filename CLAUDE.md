# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Objective

Build Visual App Builder as a separate Frappe app installed inside an existing ERPNext/SMS site.

The product should allow authorised non-developers to visually define record-based and workflow-based applications. The first applications are QA Lifecycle Manager, Document Control Manager and Learning Material Vetting Manager.

## What exists today

This repository is a starter and handover pack, not yet an installable Frappe app. The only executable code is:

- `scripts/check_repository.py` — validates required files exist and validates every JSON definition in `examples/` (required top-level keys, `schema_version` "0.1", unique stable IDs, workflow transitions referencing known states). This is the single source of validation logic; `tests/test_definitions.py` imports and reuses it.
- `examples/*.json` — one application definition per demonstration app, conforming to `schemas/application-definition.schema.json` and `docs/DEFINITION_MODEL.md`.
- `prototype/visual_app_builder_prototype.html` — standalone visual reference only; do not extend it.

`frappe_app/` and `frontend/` are placeholders. The real Frappe app gets generated later with `bench new-app` in a target bench (see Implementation order).

## Definition model in brief

Each application is one versioned JSON document with top-level sections: `application`, `pages`, `data_model`, `workflow`, `automations`, `permissions`, `translations`, `notifications`, `tests`. IDs (pages, entities, states, transitions, automations, notifications, tests) are stable and unique across the document. Lifecycle: Draft → Technical Review → UAT → Approved → Published → Archived; published versions are immutable, changes create a new version. Full details in `docs/DEFINITION_MODEL.md`.

## Read first

Before changing code, read:

1. `README.md`
2. `CURRENT_STATUS.md`
3. `docs/DECISIONS.md`
4. `docs/ARCHITECTURE.md`
5. `docs/MVP_SCOPE.md`
6. the relevant file under `requirements/`

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

Before committing documentation or definition changes:

```bash
python3 scripts/check_repository.py
python3 -m unittest discover -s tests -v
```

Run a single test:

```bash
python3 -m unittest tests.test_definitions.DefinitionTests.test_all_example_definitions_are_valid -v
```

No external packages are required; everything runs on the Python 3 standard library. If you change the definition format, update `scripts/check_repository.py`, `schemas/application-definition.schema.json`, `docs/DEFINITION_MODEL.md` and all three `examples/*.json` together — the checks fail otherwise.

Once the real Frappe app exists, add the bench test commands for that environment to this file.

## First requested deliverable

Produce a technical plan for Phase 1 and implement only the minimum skeleton needed to:

1. save a QA Lifecycle Manager definition;
2. load it through a shared runtime;
3. render one list page and one record page;
4. enforce user permissions;
5. move a record through a small workflow;
6. record a UAT result;
7. publish an immutable version.

Do not start by rebuilding the complete visual prototype in React.
