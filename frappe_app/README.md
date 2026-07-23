# Future Frappe App

This directory is intentionally documentation-only.

Do not hand-build or install a generic Frappe scaffold before confirming the Frappe version used by the target SMS.

Inside the matching development bench, generate the real app:

```bash
bench new-app visual_app_builder
bench --site your-development-site install-app visual_app_builder
```

Then implement the first DocTypes and runtime in that generated repository.

## Initial proposed DocTypes

- Visual Application
- Visual Application Version
- Component Registry
- Visual App Test Case
- Visual App UAT Run
- Visual App Deployment Log

## Initial proposed services

- definition validation;
- permission-aware loading;
- form and list runtime;
- workflow execution;
- notification dispatch;
- version publication and rollback.
