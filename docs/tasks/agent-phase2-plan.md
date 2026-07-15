---
status: in-progress
phase: 2
updated: 2026-07-13
---

# Implementation Plan: Phase 2 — Social Actions + Action Buttons

## Goal
Extend the AI agent to perform social actions (like, bookmark, comment) and add clickable action buttons on AI messages for manual trigger.

## Context & Decisions
| Decision | Rationale | Source |
|----------|-----------|--------|
| Toggle API for like/bookmark | Existing API uses toggle (POST /api/likes/toggle, POST /api/bookmarks/toggle) | Exploration of like.routes.js and bookmark.routes.js |
| Direct API calls from composable | Like/bookmark/comment actions need real HTTP calls, not just router navigation | Analysis of useAgentExecutor.js pattern |
| No user confirmation for Phase 2 | Consistent with Phase 1 auto-execution design — actions fire without confirmation | Phase 1 decision |
| Action buttons as extra UI on messages | Users can manually trigger actions if they missed auto-execution; buttons read from pendingActions | Low-priority enhancement |

## Phase 2: Social Actions [IN PROGRESS]
- [x] 2.1 Commit Phase 1 (commit `5e3858b`)
- [ ] **2.2 Backend: Extend agent-tools.js with social action builders** ← CURRENT
  - Add `buildSocialActions(intent, message)` to detect like/bookmark/comment intent
  - Add `extractArtworkId(message)` helper to extract artwork ID from message
  - Export new functions
- [ ] 2.3 Backend: Update ai.service.js system prompt
  - Add social action capabilities description to `buildAgentSystemPrompt()`
- [ ] 2.4 Frontend: Extend useAgentExecutor.js with social action handlers
  - Add `like` case → calls `likeApi.toggle(artworkId)`
  - Add `bookmark` case → calls `bookmarkApi.toggle(artworkId)`
  - Add `comment` case → calls `createComment({ artwork, content })`
  - Import API functions from `../../services/api.js`
- [ ] 2.5 Frontend: Wire social actions into ChatBubble.vue watcher
  - Social actions already processed through watcher `pendingActions.length` → `execute()` — no wiring needed
- [ ] 2.6 E2E test social actions
  - Test "thích artwork [id]" → verify like toggled
  - Test "lưu artwork [id]" → verify bookmark toggled
  - Test "bình luận artwork [id] nội dung hay quá" → verify comment created

## Phase 3: Action Buttons on Messages [PENDING]
- [ ] 3.1 Add `actions` field to AI messages in store
  - Store which actions were emitted for each assistant message
- [ ] 3.2 Create ActionButtons sub-component
  - Renders clickable buttons below AI message content
  - Buttons: "🔍 Mở kết quả", "🖼️ Xem artwork", "❤️ Thích", etc.
- [ ] 3.3 Integrate into ChatMessageList.vue
  - Show action buttons on assistant messages that have actions

## Files to modify
- `backend/services/agent-tools.js` — add social action builders
- `backend/services/ai.service.js` — update system prompt
- `frontend/src/composables/useAgentExecutor.js` — add social action handlers
- `frontend/src/stores/chat.store.js` — store actions per message (Phase 3)
- `frontend/src/components/chat/ChatMessageList.vue` — add action buttons (Phase 3)

## Notes
- 2026-07-13: Phase 1 committed as `5e3858b`. Agent actions for search/navigate/view-artwork confirmed working via E2E test. Chat bubble panel had a Pinia/HMR state corruption issue (pendingActions became falsy) that was fixed by page refresh — no code changes needed.
