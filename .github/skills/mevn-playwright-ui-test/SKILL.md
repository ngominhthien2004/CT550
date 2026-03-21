---
name: mevn-playwright-ui-test
description: "Test MEVN frontend user flows using Playwright after feature changes. Use for smoke tests, auth flow checks, and regression checks on views/routes."
---

# MEVN Playwright UI Test

## Use when
- User asks to verify frontend behavior.
- Feature touches routing, auth, form flow, or data rendering.

## Minimal flow set
1. Home page renders comic list.
2. Login flow handles success/failure.
3. Comic detail and chapter read flow works.
4. Route guards block unauthorized access.

## Output format
- Test scope
- Steps executed
- Passed/failed results
- Repro notes for failures
