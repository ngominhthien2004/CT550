# Real-time DM Delivery + Notifications Implementation Plan

> [!NOTE]
> This document may not reflect the current implementation.
> See the final report for up-to-date state:
> [Final Report](../reports/realtime-dm-notifications.md)

> **For agentic workers:** REQUIRED SUB-SKILL: Use compose:subagent (recommended) or compose:execute to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable real-time DM delivery via Socket.IO and create Notification records for new incoming messages, replacing the current 10-second polling-only approach.

**Architecture:** Add a shared Socket.IO holder utility (`utils/socket.js`), emit `message:new` events from the message controller after DB write, create Notification records for new DMs, and listen for `message:new` on the frontend to update UI instantly. Polling is kept as fallback.

**Tech Stack:** Socket.IO 4.8.3, MongoDB/Mongoose, Vue 3 + Pinia, existing `useSocket` composable.

## Global Constraints

- Backend uses CommonJS (`require`/`module.exports`) — NO ESM syntax
- Frontend uses ESM (Vite-native)
- Socket.IO instance is created in `server.js` and passed to utilities via setter pattern
- Notification model supports `type`, `actor`, `message`, `metadata` fields
- Frontend Socket.IO client is already connected in `AppTopBar.vue` via `useSocket` composable
- MessagesView.vue has its own polling — Socket.IO listener should supplement, not replace polling (polling is fallback)

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `backend/utils/socket.js` | Shared Socket.IO instance holder (get/set pattern) |
| Modify | `backend/server.js:170` | Call `setSocketIO(io)` for the new socket utility |
| Modify | `backend/controllers/message.controller.js:94-105` | Emit `message:new` + create Notification after message creation |
| Modify | `frontend/src/views/MessagesView.vue` | Listen for `message:new` via Socket.IO, add to local state |
| Modify | `frontend/src/components/layout/AppTopBar/AppTopBar.vue:172` | Listen for `message:new` to refresh message preview badge |

---

### Task 1: Create shared Socket.IO holder utility

**Files:**
- Create: `backend/utils/socket.js`

**Interfaces:**
- Produces: `getSocketIO()` returns the io instance or null, `setSocketIO(io)` stores it

- [ ] **Step 1: Create the utility module**

```js
// backend/utils/socket.js
let io = null;

function setSocketIO(socketIO) {
    io = socketIO;
}

function getSocketIO() {
    return io;
}

module.exports = { setSocketIO, getSocketIO };
```

- [ ] **Step 2: Verify file was created**

Run: `type backend\utils\socket.js`
Expected: File content matches above

- [ ] **Step 3: Commit**

```bash
git add backend/utils/socket.js
git commit -m "feat: add shared Socket.IO holder utility"
```

---

### Task 2: Register Socket.IO instance in server.js

**Files:**
- Modify: `backend/server.js:170-171`

**Interfaces:**
- Consumes: `setSocketIO` from `backend/utils/socket.js`
- Produces: `io` instance available via `getSocketIO()` throughout the app

- [ ] **Step 1: Add require and call setSocketIO in server.js**

After the existing line `setSocketIO(io);` (line 171, which sets it for notification.js), add:

```js
// backend/server.js — after line 171
const { setSocketIO: setSocketIOForMessages } = require('./utils/socket');
setSocketIOForMessages(io);
```

The full block at the end of server.js (lines 169-175) becomes:

```js
// Pass Socket.IO to notification utility
const { setSocketIO } = require('./utils/notification');
setSocketIO(io);

// Pass Socket.IO to shared socket holder
const { setSocketIO: setSocketIOForMessages } = require('./utils/socket');
setSocketIOForMessages(io);

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
```

- [ ] **Step 2: Verify the edit**

Run: `Select-String -Path "backend\server.js" -Pattern "setSocketIOForMessages"`
Expected: One match found

- [ ] **Step 3: Commit**

```bash
git add backend/server.js
git commit -m "feat: register Socket.IO instance in shared holder"
```

---

### Task 3: Emit message:new + create Notification in message controller

**Files:**
- Modify: `backend/controllers/message.controller.js:1-3` (imports)
- Modify: `backend/controllers/message.controller.js:94-105` (after message creation)

**Interfaces:**
- Consumes: `getSocketIO()` from `backend/utils/socket.js`, `createNotification` from `backend/utils/notification.js`
- Produces: `message:new` Socket.IO event emitted to recipient room, Notification record created

- [ ] **Step 1: Add imports at top of message.controller.js**

Change the top of the file from:

```js
const Message = require('../models/Message');
const User = require('../models/User');
const path = require('path');
```

To:

```js
const Message = require('../models/Message');
const User = require('../models/User');
const path = require('path');
const { getSocketIO } = require('../utils/socket');
const { createNotification } = require('../utils/notification');
```

- [ ] **Step 2: Add Socket.IO emit + notification after message creation**

In the `createMessage` function, after the `res.status(201).json(populated);` line (currently line 105), add the real-time emit and notification. Replace the block from line 94 to 105:

```js
        const message = await Message.create({
            sender: req.user._id,
            recipient: recipientId,
            content: msgContent,
            images,
        });

        const populated = await Message.findById(message._id)
            .populate('sender', 'username displayName avatar')
            .populate('recipient', 'username displayName avatar');

        // Emit real-time DM event to recipient
        const io = getSocketIO();
        if (io) {
            io.to(`user:${recipientId}`).emit('message:new', populated);
        }

        // Create notification record for the new message
        const preview = msgContent
            ? (msgContent.length > 100 ? msgContent.substring(0, 100) + '...' : msgContent)
            : (images.length > 0 ? '[Image]' : '');
        createNotification({
            userId: recipientId,
            actorId: req.user._id,
            type: 'message',
            message: preview || 'Sent you a message',
            metadata: { messageId: message._id, senderUsername: req.user.username },
        });

        res.status(201).json(populated);
```

- [ ] **Step 3: Verify the edit**

Run: `Select-String -Path "backend\controllers\message.controller.js" -Pattern "message:new"`
Expected: One match found

- [ ] **Step 4: Run backend tests**

Run: `npm test` (in backend directory)
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add backend/controllers/message.controller.js
git commit -m "feat: emit real-time message:new event and create notification for new DMs"
```

---

### Task 4: Listen for message:new in MessagesView.vue

**Files:**
- Modify: `frontend/src/views/MessagesView.vue:1-13` (imports)
- Modify: `frontend/src/views/MessagesView.vue:430` (onMounted)
- Modify: `frontend/src/views/MessagesView.vue:449` (onUnmounted)

**Interfaces:**
- Consumes: `useSocket` composable from `frontend/src/composables/useSocket.js`
- Produces: `message:new` event handler that adds incoming messages to local state

- [ ] **Step 1: Add useSocket import**

In the imports section of MessagesView.vue (after line 10), add:

```js
import { useSocket } from '../composables/useSocket'
```

- [ ] **Step 2: Initialize socket composable**

After the existing `const messageStore = useMessageStore()` line (line 46), add:

```js
const { connect: connectSocket, disconnect: disconnectSocket, on: socketOn, off: socketOff } = useSocket()
```

- [ ] **Step 3: Add message:new event handler function**

After the `stopMessagePolling` function (around line 280), add:

```js
function handleIncomingMessage(message) {
  if (!message || !message._id) return
  const myId = currentUserId.value
  const isIncoming = String(message.recipient?._id || '') === String(myId)
  if (!isIncoming) return // only handle messages addressed to me

  const exists = [...inboxMessages.value, ...sentMessages.value].some(m => m._id === message._id)
  if (exists) return // deduplicate

  inboxMessages.value = [message, ...inboxMessages.value]

  // Play notification sound if not viewing this thread
  if (selectedThreadId.value !== String(message.sender?._id || '')) {
    playNotificationSound()
  }
}
```

- [ ] **Step 4: Connect socket and register listener in onMounted**

Change the `onMounted` call from:

```js
onMounted(() => { loadMessages() })
```

To:

```js
onMounted(() => {
  loadMessages()
  connectSocket()
  socketOn('message:new', handleIncomingMessage)
})
```

- [ ] **Step 5: Disconnect socket and unregister listener in onUnmounted**

Change the `onUnmounted` call from:

```js
onUnmounted(() => { stopPresencePolling(); stopMessagePolling() })
```

To:

```js
onUnmounted(() => {
  stopPresencePolling()
  stopMessagePolling()
  socketOff('message:new', handleIncomingMessage)
  disconnectSocket()
})
```

- [ ] **Step 6: Verify frontend builds**

Run: `npm run build` (in frontend directory)
Expected: Build succeeds with no errors

- [ ] **Step 7: Commit**

```bash
git add frontend/src/views/MessagesView.vue
git commit -m "feat: listen for real-time message:new events in MessagesView"
```

---

### Task 5: Refresh message preview badge on real-time DM

**Files:**
- Modify: `frontend/src/components/layout/AppTopBar/AppTopBar.vue:166-174` (onMounted)

**Interfaces:**
- Consumes: `useSocket` composable (already imported), `handleIncomingMessage` pattern
- Produces: Top bar message badge updates instantly on new DM

- [ ] **Step 1: Add message:new handler in AppTopBar.vue**

After the existing `handleNewNotification` function (around line 164), add:

```js
function handleNewMessageForBadge(message) {
  if (!message || !message._id) return
  const myId = userId.value
  if (String(message.recipient?._id || '') !== String(myId)) return
  // Refresh the message preview to update unread count
  loadMessagePreview()
}
```

- [ ] **Step 2: Register the listener in onMounted**

In the `onMounted` block (line 166-174), add the listener after the existing `on('notification:new', handleNewNotification)` line:

```js
onMounted(() => {
  loadNotificationPreview()
  loadMessagePreview()
  startNotificationPolling()

  // Connect Socket.IO and listen for real-time notifications
  connect()
  on('notification:new', handleNewNotification)
  on('message:new', handleNewMessageForBadge)
})
```

- [ ] **Step 3: Unregister the listener in onBeforeUnmount**

In the `onBeforeUnmount` block (line 176-180), add:

```js
onBeforeUnmount(() => {
  stopNotificationPolling()
  off('notification:new', handleNewNotification)
  off('message:new', handleNewMessageForBadge)
  disconnect()
})
```

- [ ] **Step 4: Verify frontend builds**

Run: `npm run build` (in frontend directory)
Expected: Build succeeds with no errors

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/layout/AppTopBar/AppTopBar.vue
git commit -m "feat: refresh message preview badge on real-time DM"
```

---

### Task 6: End-to-end verification

- [ ] **Step 1: Start backend server**

Run: `npm run dev` (in backend directory)
Expected: Server starts on port 5000

- [ ] **Step 2: Start frontend dev server**

Run: `npm run dev` (in frontend directory)
Expected: Vite dev server starts on port 5173

- [ ] **Step 3: Manual test — send DM from user A to user B**

- Open two browser tabs, log in as two different users
- User A sends a message to User B
- Verify: User B sees the message appear instantly (without waiting for 10s poll)
- Verify: Top bar message badge updates for User B
- Verify: A notification record is created (check DB or notification panel)

- [ ] **Step 4: Verify polling still works as fallback**

- Disconnect Socket.IO (simulate network issue)
- Send a message
- Verify: Message appears after next poll cycle (~10s)

- [ ] **Step 5: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: address issues found during e2e verification"
```
