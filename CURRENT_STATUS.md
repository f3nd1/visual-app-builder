# Current Status

## Completed

- Product direction agreed.
- Generic repository name selected: `visual-app-builder`.
- Standalone interactive prototype created.
- Target architecture agreed: separate Frappe app inside the existing ERPNext/SMS environment.
- Read and write access model agreed: actions follow ERPNext permissions.
- First demonstration applications selected.
- Initial application-definition schema and examples included in this repository.

## Not completed

- No production Frappe app has been generated.
- No connection to the UCC SMS exists.
- No real DocTypes, Workflows, Notifications or Server Scripts have been created.
- No live email is sent.
- No production data has been accessed.
- No automated compiler or deployment process exists.

## Immediate next decision

Confirm:

- Frappe version;
- ERPNext version;
- development site name;
- whether bench and repository access are available;
- whether the production environment permits installation of a custom app.

After confirmation, generate the real Frappe scaffold using the matching environment rather than relying on a hand-written generic scaffold.
