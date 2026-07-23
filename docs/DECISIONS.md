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
