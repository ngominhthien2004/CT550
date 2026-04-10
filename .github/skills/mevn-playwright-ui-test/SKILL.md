---
name: mevn-playwright-ui-test
description: "Test MEVN frontend user flows after feature changes. Use for smoke tests, auth flow checks, and regression checks on views/routes. For screenshot capture in chat automation, prefer Chrome DevTools MCP tools."
---

# MEVN Playwright UI Test

## Use when
- User asks to verify frontend behavior.
- Feature touches routing, auth, form flow, or data rendering.

## Minimal flow set
1. Home page renders artwork feed/list.
2. Login flow handles success/failure.
3. Artwork detail and comments flow works.
4. Route guards block unauthorized access.

## Screenshot rule
- Prefer Chrome DevTools MCP screenshot tools for capture in chat automation.
- Use Playwright primarily for interaction flow checks, assertions, and reproducible navigation.

## Output format
- Test scope
- Steps executed
- Passed/failed results
- Repro notes for failures
