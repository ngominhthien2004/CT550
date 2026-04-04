---
applyTo: "frontend/src/**/*.{js,vue}"
description: "Portable rules for Vue 3 frontend files in MEVN projects."
---
# Frontend Rules (Portable)

## Structure
- Keep route pages in `src/views/`.
- Keep reusable UI in `src/components/`.
- Keep shared state and async business logic in Pinia stores.
- Use shared API client under `src/services/`.

## Data and State Rules
- Avoid duplicating API calls across views when store actions can centralize.
- Keep loading/error/success states explicit.
- Keep auth/session state managed through auth store and centralized token flow.

## Router and Auth Rules
- Keep route definitions and guards centralized in router files.
- Use route metadata for authorization where practical.
- Do not introduce new auth flow unless requested.

## API Consumption Rules
- Use the shared HTTP client instance and interceptors.
- Keep endpoint paths aligned with backend contracts.
- Surface user-safe error messages with sane fallbacks.

## UI and Build Safety
- Keep UI changes minimal and consistent with existing patterns.
- Do not introduce new UI frameworks without explicit request.
- Bootstrap 5 CSS is approved when explicitly requested; prefer Bootstrap utility/layout classes before adding repeated custom CSS.
- For icons, use one consistent icon set across a screen (prefer Font Awesome when installed); avoid mixing emoji icons with icon libraries.
- For icon-only controls, include accessible labels (`aria-label`/`title`) and hide decorative icons from screen readers (`aria-hidden="true"`).
- After frontend UI changes, run a browser smoke test on affected routes (prefer Playwright) before reporting completion.
- Verify compile/build compatibility after changes.
