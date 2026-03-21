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
- Avoid introducing new UI frameworks without explicit request.
- Verify compile/build compatibility after changes.
