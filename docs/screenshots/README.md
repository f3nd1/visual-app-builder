# Screenshots

Captured from the running app (headless Chromium) with QA Lifecycle Manager as
the primary demo. Regenerate with `frontend/scripts/screenshots.mjs` against a
running dev server (`npm run dev -- --port 5178`). All data is synthetic.

## Studio (design-time builder)

| File | Shows |
|---|---|
| `studio-application.png` | Application editor — code/title/description/status/version. |
| `studio-data-model.png` | Data Model editor, registry-gated — entities with approved DocTypes/fields. |
| `studio-data-model-registry-violation.png` | After "Import registry…" narrows the whitelist: red warning + flagged unapproved DocTypes/fields (D-004). |
| `studio-page-canvas.png` | Page canvas — the Record Detail page with a record form + workflow-history component. |
| `studio-page-canvas-context-menu.png` | Component kebab/right-click menu open (Edit/Duplicate/Bind data/Add visibility condition/Move/Delete). |
| `studio-workflow-editor.png` | Workflow node canvas — the 7-state QA machine with transitions. |
| `studio-automation-editor.png` | Automation editor — form-based trigger → condition → action. |
| `studio-meta-permissions.png` | MetaEditor / Permissions — role × entity × read/write/create/submit grid. |
| `studio-meta-translations.png` | MetaEditor / Translations — English + Simplified Chinese (zh-CN). |
| `studio-issues-panel.png` | Issues panel with a flagged schema violation (invalid application.code). |
| `studio-publish.png` | Publish confirmation in the top bar — version + checksum. |

## Runtime (staff-facing renderer)

| File | Shows |
|---|---|
| `runtime-harness-picker.png` | Dev harness header listing the published app + version, plus the dashboard metrics. |
| `runtime-list-view.png` | Rendered list view — QA Review records. |
| `runtime-record-detail.png` | Rendered form/detail — a QA Review with inferred field widgets + workflow panel. |
| `runtime-workflow-transition.png` | After a workflow transition — record advanced to "Corrective Action Required", next transition offered. |
| `runtime-automation-log.png` | Automation log after a triggered `record_created` automation (email stub logged, field auto-set). |
| `runtime-document-control.png` | Document Control Manager list — shared-runtime proof (same renderers, different app). |
| `runtime-material-vetting.png` | Material Vetting Manager list — shared-runtime proof. |
| `runtime-permission-denied.png` | No-role user denied read access to QA Review. |
