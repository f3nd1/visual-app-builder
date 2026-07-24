# Development Tasks

## Phase 0: Environment and governance

- [ ] Confirm Frappe and ERPNext versions.
- [ ] Create a separate development site.
- [ ] Confirm repository and bench access.
- [ ] Generate the Frappe app with `bench new-app visual_app_builder`.
- [ ] Install it on the development site only.
- [ ] Record test users and roles.
- [ ] Confirm backup and rollback procedure.

## Phase 1: Definition storage and runtime

- [ ] Create Visual Application DocType.
- [ ] Create Visual Application Version DocType.
- [ ] Create Component Registry DocType.
- [ ] Create Test Case DocType.
- [ ] Create Visual App UAT Run DocType (system-level, records UAT results against a published Visual Application Version; distinct from a QA Lifecycle Manager review's own UAT Run business record).
- [ ] Create Deployment Log DocType.
- [ ] Add server-side definition validation.
- [ ] Add permission-aware definition loading.
- [ ] Build one shared form renderer.
- [ ] Build one shared list renderer.
- [ ] Add immutable publication snapshot.

## Phase 2: QA Lifecycle Manager

- [ ] Create QA plan.
- [ ] Create review assignment.
- [ ] Add evidence checklist.
- [ ] Add finding and corrective-action flow.
- [ ] Add reminder and action-required emails.
- [ ] Add UAT register and sign-off.
- [ ] Add independent closure verification.
- [ ] Add closure email and evidence package.

## Phase 3: Reuse proof

- [ ] Build Document Control Manager from the same runtime.
- [ ] Build Learning Material Vetting Manager from the same runtime.
- [ ] Document what required new shared components.
- [ ] Reject application-specific code where a definition can express the behaviour.

## Later

- [ ] React and TypeScript visual builder.
- [ ] Node and edge editor.
- [ ] Translation assistant.
- [ ] Definition comparison.
- [ ] Package export.
- [ ] AI configuration assistant.
