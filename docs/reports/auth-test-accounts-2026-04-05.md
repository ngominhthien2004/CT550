# Auth Test Accounts - 2026-04-05

## Scope
- Implemented frontend pages:
  - `/signup`
  - `/login`
  - `/account` (session info + logout)
- Executed auth API verification with 3 test accounts (register + login).

## Test Account Credentials (Local Dev Only)

| Username | Email | Password | Register | Login | Role |
|---|---|---|---|---|---|
| qa_auth_20260405_a | qa_auth_20260405_a@example.com | QaAuth!2026A | 201 Created | 200 OK | user |
| qa_auth_20260405_b | qa_auth_20260405_b@example.com | QaAuth!2026B | 201 Created | 200 OK | user |
| qa_auth_20260405_c | qa_auth_20260405_c@example.com | QaAuth!2026C | 201 Created | 200 OK | user |

Notes:
- These are local testing credentials for this repository environment only.
- JWT token issuance confirmed on all 3 login attempts.

## Account Type Analysis

Based on `backend/models/User.js`:

1. Role dimension (`role` enum)
- `user`
- `admin`

2. Premium dimension (`isPremium` boolean)
- `false` (default)
- `true`

### Practical account categories in this system
1. Standard User
- `role = user`
- `isPremium = false`

2. Premium User
- `role = user`
- `isPremium = true`

3. Admin
- `role = admin`
- `isPremium` can be false or true (premium is independent from role)

Conclusion:
- If grouping by product behavior, you can treat it as 3 common categories:
  - Admin
  - User
  - UserPremium
- Technically, data model supports a matrix of combinations because `role` and `isPremium` are separate fields.
