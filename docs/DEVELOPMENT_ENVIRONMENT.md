# Development Environment

## Recommended arrangement

```text
GitHub repository
        |
        v
Local Frappe bench development site
        |
        v
Separate UAT site
        |
        v
Production SMS site
```

## Important

Do not manually copy the placeholder directories in `frappe_app/` into production and treat them as an app.

After confirming the target Frappe version, create the real app from inside the matching bench:

```bash
bench new-app visual_app_builder
bench --site your-development-site install-app visual_app_builder
```

Then merge this repository's documentation, schemas, examples and prototype into the generated repository.

## Why generate from Bench

The generated app structure and project metadata can differ by Frappe version. Using the target Bench avoids a misleading or incompatible hand-written scaffold.
