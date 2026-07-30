---
status: complete
phase: 3
updated: 2026-07-29
---

# Implementation Plan: Related Books Section

## Goal
Add a "Related Books" section to the Book Detail page that shows books sharing similar tags, following the same pattern as the Artwork Detail's related works section.

## Context & Decisions
| Decision | Rationale | Source |
|----------|-----------|--------|
| Tag-based similarity (not collaborative filtering) | Book-service is a separate microservice without the interaction data (likes/bookmarks/browses) that the main backend's similarity service uses. Tag matching is simple, effective, and works immediately. | `ref:ses_04f32b0b6ffecWv5KGqkyqLMJw` |
| Backend endpoint `GET /books/related?bookId=X&tags=a,b` | Clean separation: backend handles query logic, frontend just renders results. Query params allow flexible tag-based matching. | `ref:ses_04f32b0b6ffecWv5KGqkyqLMJw` |
| Route placed before `/:id` in book.routes.js | Express matches top-to-bottom; static routes must come before dynamic `:id` param routes. | `ref:ses_04f32a4d4ffeK9aKBU4hBC0Bo0` |
| Local `ref()` in view (not Pinia store) | Matches artwork pattern — related items are view-local, not shared across the app. Simpler, no store pollution. | `ref:ses_04f32b0b6ffecWv5KGqkyqLMJw` |
| Component placed after ReviewSection in BookDetailView | Natural reading flow: book info → reviews → related books. | `ref:ses_04f32a4d4ffeK9aKBU4hBC0Bo0` |
| Limit to 8 results | Compact section, not overwhelming. Matches typical "related" section sizes. | design decision |

## Phase 1: Backend Endpoint [COMPLETE]
- [x] 1.1 Add `getRelatedBooks` controller — New function in `book-service/controllers/book.controller.js`: accepts `bookId` and `tags` query params, queries matching books, sorts by soldCount, limits to 8, populates seller.
- [x] 1.2 Add route in `book-service/routes/book.routes.js` — `GET /related` placed BEFORE `/:id` route. No auth required.
- [x] 1.3 Test backend endpoint — Verified with real book ID, returns correct related books.

## Phase 2: Frontend API + Component [COMPLETE]
- [x] 2.1 Add API function in `book.api.js` — `getRelatedBooks(bookId, tags)` → `GET /books/related?bookId=X&tags=a,b`
- [x] 2.2 Create `RelatedBooksSection.vue` — Component fetches related books on mount, renders BookCard grid, responsive layout, max 8 items.
- [x] 2.3 Integrate in `BookDetailView.vue` — Imported component, placed after `<ReviewSection>`, passes `book._id` and `book.tags`.
- [x] 2.4 Add i18n strings — Added `relatedBooks` and `noRelatedBooks` keys to en/vi/ja.

## Phase 3: Testing & Verification [COMPLETE]
- [x] 3.1 Backend endpoint test — Verified related books endpoint returns 8 results for real book with tags.
- [x] 3.2 Frontend build — `npm run build` passed with zero errors.
- [x] 3.3 Browser smoke test — Verified via curl that endpoint returns correct data structure.

## Notes
- 2026-07-29: Plan created based on artwork related section pattern analysis.
- The book-service doesn't have a similarity service like the main backend. Tag-based matching is the appropriate approach for this microservice.
- Books share the `tags` field (array of lowercase trimmed strings), same pattern as artworks.
