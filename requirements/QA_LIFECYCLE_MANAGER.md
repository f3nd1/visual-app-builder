# QA Lifecycle Manager Requirements

## Purpose

Make QA work easier from planning to closure, including assignments, evidence, findings, corrective actions, UAT, emails, sign-off and retained evidence.

## End-to-end journey

```text
Annual QA Plan
-> Review Scope and Checklist
-> Assign Process Owner and Reviewer
-> Send Assignment Email
-> Collect Evidence
-> Conduct Review
-> Record Finding or Pass
-> Create Corrective Action
-> Send Action-Required Email
-> Track Due Date and Escalate
-> Verify Implementation
-> Prepare UAT
-> Send UAT Invitation
-> Record UAT Results
-> Fix and Retest
-> Obtain Process Owner Sign-off
-> Obtain Independent QA Closure
-> Send Closure Email
-> Lock Evidence Package
```

## Main records

- QA Plan
- QA Review
- QA Checklist Item
- QA Finding
- Corrective Action
- UAT Run
- UAT Test Case
- QA Closure Verification
- QA Communication Log

## Main pages

- QA Calendar
- My Assigned Reviews
- Review Workspace
- Findings and Corrective Actions
- UAT Centre
- Closure Verification
- Readiness Dashboard
- Email and Communication History

## Required automations

- create review assignments from approved plan;
- email assigned reviewer and process owner;
- remind before evidence due date;
- escalate overdue evidence;
- create corrective action from failed checklist item;
- email action owner;
- remind and escalate overdue action;
- block closure until evidence and effectiveness verification are complete;
- invite selected users to UAT;
- notify developer or action owner when UAT fails;
- request final sign-off after all tests pass;
- send closure notification and lock the version.

## UAT test examples

- authorised user can open assigned review;
- unauthorised department cannot view restricted evidence;
- failed checklist item creates a finding;
- overdue action triggers escalation;
- closure is blocked without effectiveness evidence;
- passed UAT allows sign-off;
- closure email is recorded in the communication log.

## Success condition

A complete QA cycle can be planned, performed, corrected, tested, approved and closed without relying on separate spreadsheets and untracked email chains.
