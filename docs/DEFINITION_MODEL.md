# Application Definition Model

Each application is represented by one versioned JSON document.

## Main sections

```json
{
  "schema_version": "0.1",
  "application": {},
  "pages": [],
  "data_model": {},
  "workflow": {},
  "automations": [],
  "permissions": [],
  "translations": {},
  "notifications": [],
  "tests": []
}
```

## Stable identifiers

Names and labels may change. These identifiers must remain stable:

- application code;
- page ID;
- component ID;
- dataset ID;
- field name;
- workflow state ID;
- transition ID;
- automation node ID;
- automation edge ID;
- notification ID;
- test ID.

## Definition lifecycle

```text
Draft -> Technical Review -> UAT -> Approved -> Published -> Archived
```

Published definitions are immutable. A change creates a new version.

## Storage recommendation

Start with one JSON field for the complete definition and indexed normal fields for application code, title, status, version, owner and publication details. Do not create one database row for every visual node during the MVP unless querying individual nodes becomes necessary.

### Exception: Automation Rule

Automation Rule is the only exception to this rule. It is deliberately exploded into its own DocType, with Automation Condition and Automation Action as child tables, because automations need independent scheduling, retry and audit logging that a JSON blob cannot support. All other node types — pages, components, workflow states and transitions — remain inside the single `definition_json` blob.
