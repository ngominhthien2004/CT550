---
feature: realtime-dm-notifications
status: delivered
specs: []
plans:
  - docs/compose/plans/2026-06-29-realtime-dm-notifications.md
branch: main
commits: pending
---

# Real-time DM Delivery + Notifications — Final Report

## What Was Built

Direct messages now arrive in real-time via Socket.IO instead of relying solely on 10-second polling. When a user sends a DM, the recipient's client receives a `message:new` Socket.IO event instantly, updating the conversation view and playing a notification sound. A Notification record is also created for each new DM, making it visible in the notification panel and top bar badge.

Polling is retained as a fallback for cases where the Socket.IO connection is interrupted.

## Architecture

### Backend Changes

| File | Change |
|------|--------|
| `backend/utils/socket.js` | **New.** Shared Socket.IO instance holder (`getSocketIO`/`setSocketIO` pattern), matching the existing pattern in `utils/notification.js`. |
| `backend/server.js:173-175` | Calls `setSocketIOForMessages(io)` to register the io instance with the new utility. |
| `backend/controllers/message.controller.js:4-5` | Imports `getSocketIO` and `createNotification`. |
| `backend/controllers/message.controller.js:107-123` | After message DB write: emits `message:new` to `user:{recipientId}` room via Socket.IO, then creates a Notification record with type `message` and a content preview. |

**Data flow:** Client A sends POST `/api/messages` -> Controller creates Message doc -> emits `message:new` via Socket.IO to recipient's room -> creates Notification record -> returns 201 to sender. Client B (recipient) receives `message:new` event via Socket.IO and updates local state.

### Frontend Changes

| File | Change |
|------|--------|
| `frontend/src/views/MessagesView.vue:11,48,284-298,448-452,471-476` | Imports `useSocket`, connects socket on mount, listens for `message:new`, adds incoming messages to `inboxMessages` array, plays notification sound if not viewing that thread. Disconnects and unregisters on unmount. |
| `frontend/src/components/layout/AppTopBar/AppTopBar.vue:166-171,181,187` | Listens for `message:new` to refresh the message preview badge instantly. |

### Design Decisions

- **Shared socket holder pattern** (`utils/socket.js`) instead of requiring `io` from `server.js` — avoids circular dependency since server.js requires routes which require controllers.
- **Polling retained as fallback** — Socket.IO may disconnect; polling every 10s ensures messages are never lost. The real-time path is optimistic (add to UI immediately), polling is the safety net.
- **Notification type `message`** — follows the existing Notification model pattern. The `metadata` field stores `messageId` and `senderUsername` for reference.
- **Deduplication in handleIncomingMessage** — checks both `inboxMessages` and `sentMessages` arrays to prevent duplicate entries from both Socket.IO and polling.

## Usage

No configuration changes needed. The feature works automatically:

1. User A sends a message to User B via the Messages page
2. User B sees the message appear instantly in their conversation (if MessagesView is open)
3. User B's top bar message badge updates immediately
4. A notification appears in User B's notification panel
5. If Socket.IO is disconnected, polling picks up the message within 10 seconds

## Verification

- **Backend tests:** 10/10 pass (`npm test` in backend/)
- **Frontend build:** Successful (`npm run build` in frontend/)
- **Manual testing required:** Open two browser tabs with different users, send a DM, verify instant delivery

## Journey Log

- [lesson] The `utils/notification.js` `setSocketIO` pattern is the established way to share the Socket.IO instance across modules — replicating it for `utils/socket.js` was the cleanest approach to avoid circular dependencies.
