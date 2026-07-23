# Minimum Viable Product Scope

## Goal

Prove that one shared system can run three different operational applications without manually rewriting a separate large codebase for each application.

## Included

- application records and version snapshots;
- page definitions;
- form, list, checklist and simple dashboard components;
- approved DocTypes and fields;
- Link and child-table relationships;
- workflow states and transitions;
- basic automations;
- email templates and system notifications;
- roles and permissions;
- English and Simplified Chinese labels;
- test cases, UAT results and publication history;
- QA Lifecycle Manager.

## Supported initial automation

Triggers:

- record created;
- record submitted;
- field changed;
- due date reached;
- scheduled daily check.

Conditions:

- field equals value;
- field is empty;
- date is overdue;
- all checklist items are complete;
- user has role;
- related record exists.

Actions:

- create record;
- update field;
- assign user;
- send email;
- send system notification;
- request approval;
- create Quality Action;
- block submission with a validation message.

## Excluded from MVP

- unrestricted SQL;
- arbitrary Python or JavaScript;
- automatic AI publication;
- a generic database join builder;
- automatic modification of standard DocTypes;
- external customer portals;
- advanced predictive analytics;
- a complete visual clone of Power Apps or Power BI.
