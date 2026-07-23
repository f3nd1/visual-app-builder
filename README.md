# Visual App Builder

A visual application builder for ERPNext/Frappe that lets authorised users design forms, workflows, automations, permissions and operational applications using existing SMS data.

## Current status

This repository is a project starter and handover pack. It contains:

- an interactive standalone prototype;
- the agreed product architecture;
- requirements for the first three demonstration applications;
- a versioned application-definition format;
- example application definitions;
- development, security, testing and UAT guidance;
- instructions for Claude Code;
- a placeholder for the future Frappe app and React/TypeScript frontend.

It is not yet an installable production Frappe app.

## Core concept

1. A designer visually creates pages, data relationships, workflow states and automation rules.
2. The design is saved as a controlled application definition.
3. A shared runtime reads the approved definition and displays the working application inside ERPNext.
4. Users may read or update SMS records only according to their ERPNext permissions.
5. Tested versions move through review, UAT, approval and publication.

The system should not generate a large new Python and JavaScript codebase for every application. Ordinary applications should run from shared components and stored definitions.

## First demonstration applications

1. QA Lifecycle Manager
2. Document Control Manager
3. Learning Material Vetting Manager

## Repository map

```text
.
├── CLAUDE.md
├── CURRENT_STATUS.md
├── TASKS.md
├── docs/
├── requirements/
├── schemas/
├── examples/
├── prototype/
├── scripts/
├── tests/
├── frappe_app/
├── frontend/
└── .github/
```

## First check

Run:

```bash
python3 scripts/check_repository.py
python3 -m unittest discover -s tests -v
```

## Important boundary

The target is a separate Frappe app installed inside the existing ERPNext environment. It should use the same site and existing SMS records, not a separate database or duplicate system.
