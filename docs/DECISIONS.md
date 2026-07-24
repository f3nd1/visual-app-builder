# Architecture Decisions

## D-001: Separate app, same ERPNext site

Visual App Builder will be a separate Frappe app installed inside the existing ERPNext environment. It will not use a separate operational database.

## D-002: Definitions before generated code

Applications are stored as versioned definitions. A shared runtime renders and operates ordinary applications. Generating dedicated code is an export option, not the default execution model.

## D-003: Permission inheritance

Reading and writing existing SMS records must follow ERPNext permissions. Elevated aggregate access, if ever introduced, requires explicit approval and separate drill-down restrictions.

## D-004: Controlled capability catalogue

Designers use approved fields, components, relationships, conditions and actions. The builder does not expose unrestricted Python, JavaScript or SQL.

## D-005: Phased frontend

The standalone HTML prototype remains the visual reference. The production visual editor may later use React and TypeScript, but Phase 1 prioritises the definition model and shared runtime.

## D-006: Separate environments

Development, automated testing and UAT occur outside the production SMS site.

## D-007: First proof applications

The first three applications are QA Lifecycle Manager, Document Control Manager and Learning Material Vetting Manager. Success requires all three to reuse the same runtime.

## D-008: Honest product boundary

The system targets record-based, workflow-based and operational applications inside ERPNext. New integrations or genuinely new interface capabilities may still require developer work.

## D-009: Studio built ahead of the backend, output schema-locked

The Studio (the visual design frontend, in `frontend/`) was built before the ERPNext backend (bench, DocTypes, shared runtime), as a deliberate sequencing exception to D-005 and to CLAUDE.md's original implementation order. The backend generation happens in a later session once local OrbStack/bench access is available; the Studio is the staff-facing *design* tool and does not require a running bench to develop.

To make this safe, the Studio's output is **schema-locked**: the editor's in-memory state *is* the definition document in the exact shape of `schemas/application-definition.schema.json` (no separate internal model, no mapping layer), and every edit is continuously validated against that real schema file plus the cross-section stable-ID rules that `scripts/check_repository.py` enforces. A round-trip check loads `examples/qa_lifecycle_manager.json`, edits it, exports, and runs the real `check_repository.py` against the output.

This is a direct response to the original `prototype/visual_app_builder_prototype.html`, which invented its own export shape (`"schema_version": "0.3-interactive-prototype"`) that matched nothing, so nothing it produced connected to the rest of the system. The Studio must never repeat that: if the schema changes, the Studio's validation fails until it is updated to match.

## D-010: Frontend stack is Vue 3 (settles the D-005 React/Vue question)

The Studio is built with **Vue 3 + Vite**. This supersedes the tentative "may later use React and TypeScript" lean in D-005. Reason: Frappe Desk and `frappe-ui` are Vue 3, so the future Runtime bundle and any Frappe integration will be Vue; building the Studio in React would fork the frontend stack and prevent reuse of `frappe-ui` controls and Desk conventions.

Supporting choices: a plain Vue `reactive()` store (no Pinia) whose state is the schema document; native HTML5 drag-and-drop with CSS grid for the page canvas; `@vue-flow/core` for the workflow node canvas; `ajv` (draft 2020-12) against the real schema file, plus a JS port of `check_repository.py`'s unique-ID and transition-reference checks, for continuous validation. The Studio and Runtime remain separate bundles (per ARCHITECTURE.md); this session built the Studio only.
