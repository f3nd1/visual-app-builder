#!/usr/bin/env python3
"""Run lightweight repository and definition checks without external packages."""

from __future__ import annotations

import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
REQUIRED_FILES = [
    "README.md",
    "CLAUDE.md",
    "CURRENT_STATUS.md",
    "TASKS.md",
    "docs/DECISIONS.md",
    "docs/ARCHITECTURE.md",
    "docs/MVP_SCOPE.md",
    "schemas/application-definition.schema.json",
    "requirements/QA_LIFECYCLE_MANAGER.md",
    "requirements/DOCUMENT_CONTROL_MANAGER.md",
    "requirements/MATERIAL_VETTING_MANAGER.md",
]


def validate_definition(path: Path) -> list[str]:
    errors: list[str] = []
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        return [f"{path.name}: invalid JSON: {exc}"]

    required = [
        "schema_version",
        "application",
        "pages",
        "data_model",
        "workflow",
        "automations",
        "permissions",
        "translations",
        "notifications",
        "tests",
    ]
    for key in required:
        if key not in data:
            errors.append(f"{path.name}: missing top-level key {key}")

    app = data.get("application", {})
    if data.get("schema_version") != "0.1":
        errors.append(f"{path.name}: schema_version must be 0.1")
    if not app.get("code"):
        errors.append(f"{path.name}: application.code is required")
    if not app.get("title"):
        errors.append(f"{path.name}: application.title is required")

    ids: set[str] = set()
    for section, items in [
        ("pages", data.get("pages", [])),
        ("entities", data.get("data_model", {}).get("entities", [])),
        ("states", data.get("workflow", {}).get("states", [])),
        ("transitions", data.get("workflow", {}).get("transitions", [])),
        ("automations", data.get("automations", [])),
        ("notifications", data.get("notifications", [])),
        ("tests", data.get("tests", [])),
    ]:
        for item in items:
            item_id = item.get("id")
            if not item_id:
                errors.append(f"{path.name}: item in {section} has no id")
            elif item_id in ids:
                errors.append(f"{path.name}: duplicate id {item_id}")
            else:
                ids.add(item_id)

    state_ids = {item.get("id") for item in data.get("workflow", {}).get("states", [])}
    for transition in data.get("workflow", {}).get("transitions", []):
        if transition.get("from") not in state_ids:
            errors.append(f"{path.name}: transition {transition.get('id')} has unknown from state")
        if transition.get("to") not in state_ids:
            errors.append(f"{path.name}: transition {transition.get('id')} has unknown to state")

    return errors


def main() -> int:
    errors: list[str] = []
    for relative in REQUIRED_FILES:
        if not (ROOT / relative).exists():
            errors.append(f"missing required file: {relative}")

    for path in sorted((ROOT / "examples").glob("*.json")):
        errors.extend(validate_definition(path))

    if errors:
        print("Repository checks failed:")
        for error in errors:
            print(f"- {error}")
        return 1

    print("Repository checks passed.")
    print(f"Validated {len(list((ROOT / 'examples').glob('*.json')))} example definitions.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
