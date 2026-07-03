# Future Features

Features stubbed out or documented as planned but not yet implemented.

## Novel upload — Save draft & Preview

- **Location**: `frontend/src/views/UploadArtworkView.vue`
- **History**: Save draft and Preview buttons were placed only on the `/upload/novel` route (inside `v-if="isNovel"`).
- **Status**: ❌ Never implemented — handlers only showed an error message.
- **Removed**: July 2, 2026 — buttons removed for consistency with other upload tabs.
- **To implement**: 
  - Backend: Add a `Draft` model or `status: 'draft'` field on Artwork model. Add routes for save/list/delete drafts.
  - Frontend: Replace stubs with real API calls. Add a "Load draft" flow. Preview could show a modal with formatted novel text.

## Not interested — Hide feed card

- **Location**: `frontend/src/components/common/CardMenuDropdown.vue`
- **Status**: ❌ Not implemented — planned as third option in the card menu dropdown.
- **To implement**:
  - Frontend: Add "Not interested" option to `CardMenuDropdown`. Store hidden artwork IDs in localStorage (key: `illuwrl.hiddenArtworks`). Filter hidden items from feed before rendering.
  - Optional backend: Add `hiddenBy` field on Artwork model or a `UserHiddenArtwork` collection for cross-device sync.

## (Add new future features here)
