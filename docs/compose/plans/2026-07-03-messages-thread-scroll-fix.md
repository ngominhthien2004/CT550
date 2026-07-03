# Messages Thread Scroll Fix — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use compose:subagent (recommended) or compose:execute to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the messages page so the thread body scrolls internally instead of growing the entire page, and modernize the layout to a proper fixed-viewport chat UI pattern.

**Architecture:** The root cause is a broken height chain — `.message-shell` uses `min-height` (allows growth), the grid has no `grid-template-rows` (rows auto-size to content), and `.thread-pane` uses `flex: 1` inside a grid context (has no effect). The fix: pin the shell to viewport height, add explicit grid row sizing, and ensure children can shrink below their content size.

**Tech Stack:** CSS Grid + Flexbox, Vue 3 scoped styles, no new dependencies.

---

## Root Cause Analysis

The height chain from viewport to `.thread-body` has no fixed constraint:

| Element | Current | Problem |
|---------|---------|---------|
| `.app-layout` | `min-height: 100vh` | Allows growth |
| `.main-pane` | no height | Auto-sizes |
| `.main-content` | no height | Auto-sizes |
| `.message-shell` | `min-height: calc(100vh - 110px)` | **Allows growth** |
| `.thread-pane` | `flex: 1` (scoped) | **Ineffective in grid context** |
| `.thread-body` | `flex: 1; overflow-y: auto` | Should scroll, but parent grows |

The `.message-shell` is a CSS Grid with `grid-template-columns: 340px minmax(0, 1fr)` but **no `grid-template-rows`**. Without explicit rows, the single implicit row auto-sizes to its tallest child. The `.thread-pane` has `flex: 1` from scoped CSS, but `flex` is a flexbox property — it has no effect in a grid context. So the thread body's `overflow-y: auto` never activates because its parent keeps growing.

---

## Global Constraints

- No new dependencies or packages
- Maintain mobile responsiveness (≤920px breakpoint already exists)
- Preserve all existing functionality: scroll-to-bottom, image loading scroll, thread switching
- CSS-only changes where possible — no JS logic changes needed
- Dark mode compatibility: all CSS vars (`--surface`, `--line`, etc.) already handle theming

---

### Task 1: Fix `.message-shell` height constraint

**Covers:** Root cause — shell growth

**Files:**
- Modify: `frontend/src/styles/MessagesView.css:1-10`

**What changes:**
- Change `min-height` to `height` on `.message-shell` — pins it to viewport size
- Add `grid-template-rows: 1fr` — makes the single row fill available height
- The `overflow: hidden` already prevents content from spilling out

- [ ] **Step 1: Apply the fix**

In `frontend/src/styles/MessagesView.css`, replace the `.message-shell` block:

```css
.message-shell {
  display: grid;
  grid-template-columns: 340px minmax(0, 1fr);
  grid-template-rows: 1fr;
  gap: 0;
  height: calc(100vh - 110px);
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--surface);
  overflow: hidden;
}
```

Changes from original:
- Added `grid-template-rows: 1fr;`
- Changed `min-height` → `height`

- [ ] **Step 2: Verify build passes**

Run: `cd frontend && npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/styles/MessagesView.css
git commit -m "fix: pin message-shell to viewport height with explicit grid rows"
```

---

### Task 2: Constrain grid children to shrink

**Covers:** Root cause — grid items exceeding row height

**Files:**
- Modify: `frontend/src/styles/MessagesView.css:145-157`
- Modify: `frontend/src/components/messages/ThreadChatPane.vue:346-350`

**What changes:**
- Add `min-height: 0` to `.thread-pane` in global CSS — allows grid item to shrink below content size (critical for `overflow-y: auto` to activate)
- Add `min-height: 0` to `.thread-body` in scoped CSS — belt-and-suspenders for flex child

- [ ] **Step 1: Update global CSS `.thread-pane`**

In `frontend/src/styles/MessagesView.css`, the second `.thread-pane` block (lines 154-157):

```css
/* Ensure thread-pane grid properly constrains the body row */
.thread-pane {
  overflow: hidden;
  grid-template-rows: auto minmax(0, 1fr) auto;
  min-height: 0;
}
```

Added `min-height: 0;` to the existing block.

- [ ] **Step 2: Update scoped CSS `.thread-body`**

In `frontend/src/components/messages/ThreadChatPane.vue`, update the scoped `.thread-body` rule (line 346-350):

```css
.thread-body {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  min-height: 0;
}
```

Added `min-height: 0;` — ensures the flex child can shrink below its intrinsic content height.

- [ ] **Step 3: Verify build passes**

Run: `cd frontend && npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/styles/MessagesView.css frontend/src/components/messages/ThreadChatPane.vue
git commit -m "fix: add min-height:0 to grid/flex children for proper scroll constraint"
```

---

### Task 3: Fix mobile responsive breakpoint

**Covers:** Mobile layout — ensure the fix doesn't break ≤920px

**Files:**
- Modify: `frontend/src/styles/MessagesView.css:674-706`

**What changes:**
- The mobile breakpoint sets `min-height: auto` on `.message-shell` — needs to stay as `auto` on mobile since the shell collapses to single-column
- Verify the mobile `grid-template-rows` override doesn't conflict

- [ ] **Step 1: Update mobile breakpoint**

In `frontend/src/styles/MessagesView.css`, the `@media (max-width: 920px)` block already has:

```css
.message-shell {
  grid-template-columns: 1fr;
  min-height: auto;
}
```

This is correct — mobile should use `min-height: auto` (content-driven). No change needed here since we changed `min-height` to `height` on the base rule, and mobile overrides with `min-height: auto` which will reset it. But we should verify `height` is unset on mobile. Update the mobile block to explicitly clear the height:

```css
@media (max-width: 920px) {
  .message-shell {
    grid-template-columns: 1fr;
    height: auto;
    min-height: 0;
  }
```

Changed `min-height: auto` → `height: auto; min-height: 0;` to properly override the base `height`.

- [ ] **Step 2: Verify build passes**

Run: `cd frontend && npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/styles/MessagesView.css
git commit -m "fix: update mobile breakpoint to override fixed height from base rule"
```

---

### Task 4: Verify in browser

**Covers:** Visual verification of the fix

**Files:** None (verification only)

- [ ] **Step 1: Start dev servers**

Run backend and frontend dev servers.

- [ ] **Step 2: Navigate to `/messages`**

Open Chrome DevTools, navigate to `http://localhost:5173/messages`.

- [ ] **Step 3: Test thread body scrolling**

- Select a conversation with multiple messages
- Verify the thread body stays within viewport — page should NOT grow
- Send several new messages — verify scrolling works, compose bar stays pinned at bottom
- Switch threads — verify scroll resets and new thread loads correctly

- [ ] **Step 4: Test mobile viewport**

- Resize browser to ≤920px width
- Verify single-column layout works
- Select a thread — verify chat fills screen properly
- Send messages — verify no page growth

- [ ] **Step 5: Test edge cases**

- Empty thread — verify placeholder text shows correctly
- Thread with images — verify images load and scroll-to-bottom works
- Reply context bar — verify it appears between thread body and compose form without breaking layout

---

## Summary of Changes

| File | Change | Purpose |
|------|--------|---------|
| `MessagesView.css` `.message-shell` | `min-height` → `height`, add `grid-template-rows: 1fr` | Pin shell to viewport, explicit row sizing |
| `MessagesView.css` `.thread-pane` | Add `min-height: 0` | Allow grid item to shrink |
| `ThreadChatPane.vue` `.thread-body` | Add `min-height: 0` | Allow flex child to shrink |
| `MessagesView.css` mobile breakpoint | `min-height: auto` → `height: auto; min-height: 0` | Proper mobile override |

**Total: 4 CSS property changes across 2 files. No JS changes. No new dependencies.**
