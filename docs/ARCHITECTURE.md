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

### Studio

The design interface for pages, fields, relationships, workflows, automations, permissions, translations and tests.

### Definition store

ERPNext records that store the application design and immutable versions.

### Shared runtime

A common set of server and browser functions that loads a published definition, renders the interface, retrieves allowed data and performs approved actions.

### Validator

Checks that a definition uses existing DocTypes, approved fields, supported operations and valid permissions.

### Publication service

Creates an immutable version, records approvals, activates it and supports rollback.

## Production shape

```text
Frappe app: visual_app_builder
├── definition DocTypes
├── runtime services
├── validation services
├── publication services
├── Desk pages
├── browser assets
└── tests
```

## Why not one Custom HTML Block

A single block is suitable for a demonstration. The final builder contains too many responsibilities and must be tested, versioned and maintained as smaller modules.

## Why not generate code for every app

Generating separate Python and JavaScript for each ordinary app recreates the original maintenance problem. Definitions and a shared runtime keep common behaviour in one place.
