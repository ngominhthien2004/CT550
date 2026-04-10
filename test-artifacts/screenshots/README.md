# Screenshot Artifact Structure

Store browser smoke-test screenshots by feature so QA evidence is easy to review.

## Folder Convention
- `test-artifacts/screenshots/account/`
- `test-artifacts/screenshots/bookmark/`
- `test-artifacts/screenshots/like-favorite/`
- `test-artifacts/screenshots/dashboard/`
- `test-artifacts/screenshots/search/`
- `test-artifacts/screenshots/navigation/`
- `test-artifacts/screenshots/follow-message-notification/`
- `test-artifacts/screenshots/reports/` for Playwright `report.html` and `report.json`

## Naming Convention
- Prefer feature-first names with optional date suffix.
- Example: `favorite-page-template-2026-04-08.png`

## Rule of Thumb
- New feature => create a new subfolder under `test-artifacts/screenshots/` before taking screenshots.
- Frontend pages should follow existing template layout patterns before generating screenshot evidence.
- Prefer ChromeDevTools MCP screenshot tools for capture in automation chat flows.
