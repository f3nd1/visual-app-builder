# Security and Permissions

## Default rule

Visual App Builder does not bypass ERPNext permissions.

A user may view, create, edit, submit or delete a record only when ERPNext permits the action and the application definition permits the interface action.

## Required controls

- approved DocTypes only;
- approved fields only;
- separate aggregate and drill-down access;
- no credentials in browser code;
- no production secrets in GitHub;
- no unrestricted SQL, Python or JavaScript;
- server-side definition validation;
- server-side permission checks;
- output escaping to prevent stored scripts in labels or descriptions;
- audit logs for publication, rollback and export;
- immutable versions used for audits;
- attachment and export controls for sensitive data.

## Data sent to AI

The default AI context should contain metadata, approved field names and aggregate values, not raw student or employee records.

## Development rule

Use synthetic or anonymised data in development and demonstration environments.
