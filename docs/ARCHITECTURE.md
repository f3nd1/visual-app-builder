# Architecture Overview

## Plain-language flow

```text
Designer creates an app visually
        |
        v
The design is saved as a controlled definition
        |
        v
The server checks fields, permissions and rules
        |
        v
A shared runtime displays the working app
        |
        v
Users read or update SMS records according to permission
        |
        v
Tested versions are approved and published
```

## Main parts

### Studio and Runtime split

Studio and Runtime are two separate frontend bundles, not one application.

### Studio

The design-time interface for pages, fields, relationships, workflows, automations, permissions, translations and tests. Available only to authorised designers and never loaded by ordinary staff.

### Definition store

ERPNext records that store the application design and immutable versions.

### Shared runtime

A lightweight, common set of server and browser functions that loads a published definition, renders the interface, retrieves allowed data and performs approved actions for ordinary staff. It contains no design or editing tools. Keeping it separate from the Studio means the bundle an ordinary user downloads stays small and cannot be used to alter a definition, even if that user's role would otherwise let them reach Studio pages.

### Validator

Checks that a definition uses existing DocTypes, approved fields, supported operations and valid permissions.

### Publication service

Creates an immutable version, records approvals, activates it and supports rollback.

## Production shape

```text
Frappe app: visual_app_builder
├── definition DocTypes
│   ├── Visual Application
│   ├── Visual Application Version (immutable snapshot, definition_json + checksum)
│   ├── Approved DocType Registry (+ Approved Field child) — the security whitelist
│   ├── Component Registry — data-driven component type -> schema + renderer
│   ├── Automation Rule (+ Automation Condition / Automation Action children)
│   ├── Test Case (+ Test Step child)
│   ├── Visual App UAT Run
│   └── Deployment Log
├── runtime services
├── validation services
├── publication services
├── Desk pages
├── browser assets
└── tests
```

### Component Registry pattern

Component types are registered once — a type name, the JSON schema for its configurable properties, its allowed field types and a renderer reference — rather than hardcoded per type inside the runtime. Adding a new component type means adding a registry entry, not changing core runtime code.

## Why not one Custom HTML Block

A single block is suitable for a demonstration. The final builder contains too many responsibilities and must be tested, versioned and maintained as smaller modules.

## Why not generate code for every app

Generating separate Python and JavaScript for each ordinary app recreates the original maintenance problem. Definitions and a shared runtime keep common behaviour in one place.
