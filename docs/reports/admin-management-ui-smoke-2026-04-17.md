# Admin Management UI Smoke Report - 2026-04-17

## Scope

- Feature: Admin Management page (`/admin`)
- Frontend URL: `http://localhost:5174`
- Backend URL: `http://localhost:5000`

## Environment

- Backend startup: `node index.js` (success)
- Frontend startup: `npm run dev` (success, port 5174)

## Test Account

- Email: `qa_admin_20260417@example.com`
- Password: `QaAdmin!2026`
- Role: `admin`

## UI Smoke Steps

1. Open `/login` and submit admin credentials.
2. Verify successful session and navigation access.
3. Open `/admin`.
4. Verify Admin overview KPI cards render.
5. Verify User Management tab renders table + role/premium actions.
6. Switch to Artwork Moderation tab and verify table + delete actions.

## Result

- Status: PASS
- Notes:
  - `/admin` route guard works for admin account.
  - Data sections are rendered with pagination controls.
  - Filter toggles and tab switching work.

## Screenshot Artifacts

- `test-artifacts/screenshots/admin-management/admin-management-users-2026-04-17.png`
- `test-artifacts/screenshots/admin-management/admin-management-artworks-2026-04-17.png`
