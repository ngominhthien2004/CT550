---
applyTo: "backend/**/*.js"
description: "Portable rules for Express/Mongoose backend files in MEVN projects."
---
# Backend Rules (Portable)

## Structure
- Keep endpoint flow: `routes -> controllers -> models`.
- Put cross-cutting concerns in middleware.
- Keep server/bootstrap wiring minimal in `server.js`.

## API Rules
- Keep REST-style route design and consistent response contracts.
- Apply authentication/authorization middleware on protected endpoints.
- For not-found resources, set status code and return meaningful errors.
- Keep handlers focused and avoid bloated controller methods.

## Data Rules
- Use Mongoose patterns consistently (`find`, `findById`, `save`, `deleteOne`).
- Keep model references and indexing strategy explicit.
- Consider cascading/related data impacts for update/delete flows.

## Error and Style Rules
- Prefer async handler pattern and centralized error middleware.
- Avoid swallowing errors; return actionable messages.
- Keep backend style consistent with repository conventions.
