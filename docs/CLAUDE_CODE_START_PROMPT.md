# Claude Code Starting Prompt

Use this after cloning the repository and opening it in Claude Code:

```text
Read CLAUDE.md, CURRENT_STATUS.md, docs/DECISIONS.md, docs/ARCHITECTURE.md and docs/MVP_SCOPE.md before proposing changes.

This repository is a project starter for Visual App Builder, a separate Frappe app installed inside an existing ERPNext/SMS site. Do not treat the standalone prototype as production code.

First inspect the repository and report:
1. what already exists;
2. what is only documentation or simulation;
3. what environment information is still required;
4. the smallest Phase 1 implementation plan.

Do not generate the complete visual editor first. Prioritise the definition model, server-side validation, shared runtime and QA Lifecycle Manager proof.

Before writing Frappe code, confirm the actual Frappe and ERPNext versions and whether this folder is already inside a Frappe bench-generated app.
```
