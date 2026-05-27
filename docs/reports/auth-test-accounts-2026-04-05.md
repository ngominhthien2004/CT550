# Auth Test Accounts - 2026-04-05

## Scope

- Implemented frontend pages:
  - `/signup`
  - `/login`
  - `/account` (session info + logout)
- Executed auth API verification with 3 test accounts (register + login).

## Test Account Credentials (Local Dev Only)

| Username           | Email                          | Password     | Register    | Login  | Role |
| ------------------ | ------------------------------ | ------------ | ----------- | ------ | ---- |
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

## Newly Created Test Accounts (Automated)

The following accounts were created via automated test runs on the local dev environment. Password for all accounts below: `Test12345!`.

### Batch A — QA-style usernames (deleted)

These QA-style accounts (`qa_mpny2dtq_*`) were removed from the database on 2026-05-27 as requested and therefore are no longer listed here.

### Batch B — Human-style usernames (30 accounts)

| Username        | Email                     | Password   |    Register | Login      | Role |
| --------------- | ------------------------- | ---------- | ----------: | ---------- | ---- |
| johnny.brooks   | johnny.brooks@gmail.com   | Test12345! | 201 Created | Not tested | user |
| xiangxia.chen   | xiangxia.chen@gmail.com   | Test12345! | 201 Created | Not tested | user |
| goku.tanaka     | goku.tanaka@gmail.com     | Test12345! | 201 Created | Not tested | user |
| mariana.silva   | mariana.silva@gmail.com   | Test12345! | 201 Created | Not tested | user |
| mateo.hernandez | mateo.hernandez@gmail.com | Test12345! | 201 Created | Not tested | user |
| priya.sharma    | priya.sharma@gmail.com    | Test12345! | 201 Created | Not tested | user |
| yuki.sato       | yuki.sato@gmail.com       | Test12345! | 201 Created | Not tested | user |
| amina.elami     | amina.elami@gmail.com     | Test12345! | 201 Created | Not tested | user |
| luca.romano     | luca.romano@gmail.com     | Test12345! | 201 Created | Not tested | user |
| noura.haddad    | noura.haddad@gmail.com    | Test12345! | 201 Created | Not tested | user |
| sofia.novak     | sofia.novak@gmail.com     | Test12345! | 201 Created | Not tested | user |
| raj.patel       | raj.patel@gmail.com       | Test12345! | 201 Created | Not tested | user |
| emilia.kowalski | emilia.kowalski@gmail.com | Test12345! | 201 Created | Not tested | user |
| kai.kurosawa    | kai.kurosawa@gmail.com    | Test12345! | 201 Created | Not tested | user |
| diego.fuentes   | diego.fuentes@gmail.com   | Test12345! | 201 Created | Not tested | user |
| hana.ali        | hana.ali@gmail.com        | Test12345! | 201 Created | Not tested | user |
| thiago.costa    | thiago.costa@gmail.com    | Test12345! | 201 Created | Not tested | user |
| leila.benali    | leila.benali@gmail.com    | Test12345! | 201 Created | Not tested | user |
| noah.schmidt    | noah.schmidt@gmail.com    | Test12345! | 201 Created | Not tested | user |
| mei.lin         | mei.lin@gmail.com         | Test12345! | 201 Created | Not tested | user |
| omar.ibrahim    | omar.ibrahim@gmail.com    | Test12345! | 201 Created | Not tested | user |
| anya.petrov     | anya.petrov@gmail.com     | Test12345! | 201 Created | Not tested | user |
| lucas.martin    | lucas.martin@gmail.com    | Test12345! | 201 Created | Not tested | user |
| fatima.zahra    | fatima.zahra@gmail.com    | Test12345! | 201 Created | Not tested | user |
| hugo.fernandez  | hugo.fernandez@gmail.com  | Test12345! | 201 Created | Not tested | user |
| ananya.iyer     | ananya.iyer@gmail.com     | Test12345! | 201 Created | Not tested | user |
| mina.nakamura   | mina.nakamura@gmail.com   | Test12345! | 201 Created | Not tested | user |
| daniel.owusu    | daniel.owusu@gmail.com    | Test12345! | 201 Created | Not tested | user |
| sofia.andersen  | sofia.andersen@gmail.com  | Test12345! | 201 Created | Not tested | user |
| igor.volkov     | igor.volkov@gmail.com     | Test12345! | 201 Created | Not tested | user |
