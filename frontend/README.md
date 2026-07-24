# Studio (design-time frontend)

The Studio is the visual builder authorised designers use to produce
application definitions. Its output is locked to
`schemas/application-definition.schema.json` — the editor's state *is* the
definition document, validated continuously against the real schema plus the
stable-ID rules that `scripts/check_repository.py` enforces (see
`docs/DECISIONS.md` D-009 and D-010).

Stack: Vue 3 + Vite, `@vue-flow/core` for the workflow node canvas, `ajv` for
schema validation. The Runtime (staff-facing renderer) is a separate bundle and
is not built here.

## Develop

```bash
cd frontend
npm install
npm run dev        # dev server
npm test           # vitest unit tests
npm run roundtrip  # export a Studio definition, validate with real check_repository.py
npm run build      # production build
```

## What it edits

One tab per definition section: Application, Data Model (entities +
relationships), Pages (drag-and-drop canvas with a data-driven component
palette), Workflow (node canvas), Automations (form-based trigger → conditions
→ actions), and Permissions/Translations/Notifications/Test Cases. A persistent
issue counter shows schema/stable-ID violations live; Save/Export writes JSON
that passes `check_repository.py` unchanged.

The earlier `prototype/visual_app_builder_prototype.html` remains a throwaway
visual reference only — it invented its own export shape and connects to
nothing. Do not extend it.
