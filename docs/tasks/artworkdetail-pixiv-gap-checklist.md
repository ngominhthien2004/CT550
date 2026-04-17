# ArtworkDetail vs Pixiv Checklist

Comparison sources:

- Pixiv page: [https://www.pixiv.net/en/artworks/143144139](https://www.pixiv.net/en/artworks/143144139)
- Current frontend: `frontend/src/views/ArtworkDetailView.vue`, `frontend/src/components/artwork/ArtworkDetailCard.vue`

## Goals

- Capture the feature gaps found in comparison.
- Implement easy items first, postpone hard items.
- Mark completed items immediately.

## Re-fetch verification (2026-04-10)

- Confirmed title, author block, Follow, "View all works", tags, counters (like/bookmark/view), upload time, related works, and works by all users are present on Pixiv.
- Parsed values from the target page: like `176`, bookmark `251`, view `4,618`, upload time `April 4, 2026 7:28 PM`.
- Rechecked against current `ArtworkDetail` implementation.

## Implementation checklist

### Easy (done first)

- [x] Show upload time in artwork detail.
- [x] Support multi-image gallery with thumbnail selection.
- [x] Show current image index / total images.
- [x] Add "View all works" link in author block (temporary route to the author's account page).

### Medium

- [x] Refine metadata layout to look closer to Pixiv grouping (title/tags/stats/time).
- [ ] Match Pixiv layout details:
  - [x] Action icon row under main image (like/bookmark/share/more).
  - [x] Author row under caption (left column) with Follow + "View all works".
  - [x] "Other works" horizontal strip under the author row (left column).
  - [x] Sidebar follow card: compact header + full-width Follow button + small "Other works" preview.
  - [x] Reduce card borders/padding to look flatter/airier like Pixiv.
- [ ] Improve related works presentation while keeping current API.

### Hard (defer or require user decision)

- [ ] Full-screen lightbox with zoom/pan.
- [ ] In-place comments (render/post/edit directly on detail page).
- [ ] Advanced recommendations (tag/author-aware).
- [ ] Full action set parity (share/report/etc.).

## Decisions for user

- [ ] Choose Pixiv parity level:
  - Option A: Core UX parity (viewer + metadata + author block)
  - Option B: Deeper parity (add lightbox/comments/share)
- [ ] Prioritize between inline comments and lightbox.

## Post-change verification

- [x] `npm run build` (frontend) passed.
- [x] Smoke check route `/artworks/:id` passed.
- [x] Capture an updated screenshot artifact (local compare): `artworkdetail-after-split-no-dup-author.png` and user-provided comparison screenshots.
