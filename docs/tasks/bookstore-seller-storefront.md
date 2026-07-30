---
status: complete
phase: 5
updated: 2026-07-29
---

# Implementation Plan: Seller Storefront Page

## Goal
Add a public seller storefront page (`/bookstore/seller/:id`) so buyers can discover and browse all published books from a specific seller, with proper navigation links from BookCard and BookDetailPage.

## Context & Decisions
| Decision | Rationale | Source |
|----------|-----------|--------|
| New public backend endpoint `GET /seller/:sellerId` | Currently only own-profile endpoint exists (`GET /seller/profile`). Need public access to view other sellers. | `ref:ses_052f2f870ffeji8qKAZBliCCcp` |
| New endpoint `GET /seller/:sellerId/books` for published books | Book model has `seller` field (ref: User). Can query `Book.find({ seller, status: 'published' })` with pagination. | `ref:ses_052f2f870ffeji8qKAZBliCCcp` |
| Route `/bookstore/seller/:id` (not `/bookstore/sellers/:id`) | Consistent with existing `/bookstore/seller` (dashboard). Use `:id` param for the User ID. | `ref:ses_052f2ea57ffeg5JwTdFnaCWyLY` |
| Seller name on BookCard should link to storefront | Currently plain text. Making it clickable improves discovery. | `ref:ses_052f2ea57ffeg5JwTdFnaCWyLY` |
| BookDetail seller pill should link to storefront | Currently links to `/account?user=...`. Redirect to bookstore seller page. | `ref:ses_052f2ea57ffeg5JwTdFnaCWyLY` |
| SellerProfile schema stays minimal (no storeName/storeBanner) | Keep scope small for first iteration. Bio + avatar from User model is sufficient. | `ref:ses_052f2f870ffeji8qKAZBliCCcp` |

## Phase 1: Backend Endpoints [COMPLETE]
- [x] 1.1 Add `getPublicSellerProfile` controller — New function in `seller.controller.js`: fetch SellerProfile by `user` param, populate user fields (_id, username, displayName, avatar). Return 404 if not found or not active.
- [x] 1.2 Add `getSellerBooks` controller — New function in `book.controller.js`: query `Book.find({ seller: sellerId, status: 'published', isActive: true })` with pagination, sort by newest. Populate seller with user fields.
- [x] 1.3 Add routes in `seller.routes.js` — `GET /public/:sellerId` (public, no auth) and `GET /public/:sellerId/books` (public, no auth). Static routes placed before dynamic to avoid conflicts.
- [x] 1.4 Test backend endpoints — Verified with real seller ID, both endpoints return correct data.

## Phase 2: Frontend API Layer [COMPLETE]
- [x] 2.1 Add API functions in `book.api.js` — `getPublicSellerProfile(sellerId)` → `GET /seller/public/:sellerId`, `getSellerPublishedBooks(sellerId, params)` → `GET /seller/public/:sellerId/books`
- [x] 2.2 Add Pinia store actions in `book.store.js` — `fetchPublicSellerProfile(sellerId)`, `fetchSellerPublishedBooks(sellerId, page)`, with corresponding state fields

## Phase 3: Seller Storefront Page [COMPLETE]
- [x] 3.1 Create `SellerStorefrontView.vue` — New view with seller header (avatar, name, bio, books count), BookGrid for published books, pagination, loading/error/empty states.
- [x] 3.2 Add route in `router/index.js` — `path: '/bookstore/seller/:id'`, name: `book-seller-public`, placed before `:id` detail route.
- [x] 3.3 Add i18n strings — Added keys to en/vi/ja bookstore.json files.

## Phase 4: Navigation Updates [COMPLETE]
- [x] 4.1 Update `BookCard.vue` — Seller name is now a `<router-link>` to `book-seller-public` with hover style and `@click.stop`.
- [x] 4.2 Update `BookDetailView.vue` — `visitSeller()` now navigates to `book-seller-public` route.

## Phase 5: Testing & Verification [COMPLETE]
- [x] 5.1 Backend endpoint tests — Both public profile and seller books endpoints verified via HTTP requests.
- [x] 5.2 Frontend build — `npm run build` passed with zero errors.
- [x] 5.3 Browser smoke test — Navigated from BookCard seller link → Seller Storefront ✅. Navigated from BookDetail seller pill → Seller Storefront ✅.

## Notes
- 2026-07-29: Plan created based on codebase analysis of seller-related endpoints and frontend components.
- SellerProfile schema has `totalSales`/`totalRevenue` fields but they're not updated by controller — this is a known gap but out of scope for this iteration.
- The `Book.seller` field references `User` (not `SellerProfile`), so seller profile lookup is `SellerProfile.findOne({ user: userId })`.
