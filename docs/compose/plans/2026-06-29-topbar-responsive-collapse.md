# Top Bar Progressive Collapse - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use compose:subagent (recommended) or compose:execute to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve the responsive top bar with progressive collapse behavior across 4 breakpoints (≥1200px, 921–1199px, 768–920px, <768px).

**Architecture:** CSS-only changes across 3 components: `AppTopBar.vue`, `AppTopBarSearchControls.vue`, and `AppSearchBar.vue`. No JavaScript logic changes needed — just media queries and flex adjustments.

**Tech Stack:** Vue 3 scoped CSS, CSS custom properties, media queries

---

## Global Constraints

- All breakpoints use `max-width` media queries (mobile-last approach)
- Existing `--surface`, `--surface-alt`, `--accent` CSS variables must be used
- No new JavaScript — CSS-only responsive behavior
- Preserve all existing functionality (search, scope selector, Post menu, notifications)

---

## File Structure

| File | Changes |
|------|---------|
| `frontend/src/components/layout/AppTopBar/AppTopBar.vue` | Logo font-size responsive, action gap adjustments |
| `frontend/src/components/layout/AppTopBar/AppTopBarSearchControls.vue` | Search bar flex behavior, remove min-width |
| `frontend/src/components/layout/AppSearchBar.vue` | Search input styling adjustments |

---

### Task 1: Logo Responsive Scaling

**Covers:** Logo scaling at each breakpoint

**Files:**
- Modify: `frontend/src/components/layout/AppTopBar/AppTopBar.vue:367-374`

**Interfaces:**
- Consumes: existing `--accent` CSS variable
- Produces: responsive `.top-site-name` font-size

- [ ] **Step 1: Update logo CSS**

Replace the `.top-site-name` style block with:

```css
.top-site-name {
  text-decoration: none;
  font-size: clamp(1.2rem, 2vw + 0.5rem, 2rem);
  line-height: 1;
  color: var(--accent);
  letter-spacing: -0.01em;
  white-space: nowrap;
  flex-shrink: 0;
}
```

- [ ] **Step 2: Verify visual result**

Run: `cd frontend && npm run dev`
Open browser, resize window to check logo scales smoothly from 1.2rem to 2rem.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/layout/AppTopBar/AppTopBar.vue
git commit -m "style: add responsive logo scaling with clamp()"
```

---

### Task 2: Search Bar Flex Behavior

**Covers:** Search bar flexibility, remove rigid min-width

**Files:**
- Modify: `frontend/src/components/layout/AppTopBar/AppTopBarSearchControls.vue:108-112`
- Modify: `frontend/src/components/layout/AppTopBar/AppTopBarSearchControls.vue:256-272`

**Interfaces:**
- Consumes: existing `AppSearchBar` component
- Produces: flexible search bar that wraps to row 2 on small screens

- [ ] **Step 1: Update desktop search bar CSS**

Replace `.top-search` style block with:

```css
.top-search {
  flex: 1 1 auto;
  width: clamp(280px, 40vw, 720px);
  min-width: 0;
}
```

- [ ] **Step 2: Update mobile media query**

Replace the `@media (max-width: 920px)` block in `AppTopBarSearchControls.vue` with:

```css
@media (max-width: 920px) {
  .top-nav-left-right {
    width: 100%;
    margin-left: 0;
    flex-wrap: wrap;
  }

  .search-unit {
    width: 100%;
    order: 2;
  }

  .top-search {
    min-width: 0;
    width: 100%;
    flex-basis: 100%;
  }

  .inline-menu {
    order: 1;
  }
}
```

- [ ] **Step 3: Update parent flex in AppTopBar.vue**

Replace the `@media (max-width: 920px)` block in `AppTopBar.vue` with:

```css
@media (max-width: 920px) {
  .top-nav {
    flex-wrap: wrap;
    height: auto;
    padding: 0.5rem 0;
  }

  .top-nav-left {
    flex-wrap: nowrap;
    width: 100%;
  }

  .top-nav-actions {
    width: 100%;
    justify-content: flex-end;
    padding-top: 0.4rem;
    border-top: 1px solid var(--line);
    margin-top: 0.4rem;
  }
}
```

- [ ] **Step 4: Verify visual result**

Run: `cd frontend && npm run dev`
Resize browser to verify:
- ≥920px: search bar inline with logo
- ≤920px: search bar moves to its own row, actions below

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/layout/AppTopBar/AppTopBarSearchControls.vue frontend/src/components/layout/AppTopBar/AppTopBar.vue
git commit -m "style: make search bar flexible and wrap on small screens"
```

---

### Task 3: Action Icons Spacing and Overflow

**Covers:** Action icon breathing room, mobile overflow behavior

**Files:**
- Modify: `frontend/src/components/layout/AppTopBar/AppTopBar.vue:376-380`
- Modify: `frontend/src/components/layout/AppTopBar/AppTopBar.vue:410-418`

**Interfaces:**
- Consumes: existing `AppTopBarPostMenu`, `AppTopBarMessagePanel`, `AppTopBarNotificationPanel`, `AppTopBarUserMenu`, `AppTopBarServicesMenu` components
- Produces: properly spaced action icons with overflow on mobile

- [ ] **Step 1: Update action gap CSS**

Replace `.top-nav-actions` style block with:

```css
.top-nav-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
```

- [ ] **Step 2: Add mobile-specific action styles**

Add new CSS rules inside the `@media (max-width: 920px)` block:

```css
@media (max-width: 920px) {
  /* ... existing rules from Task 2 ... */

  .top-nav-actions {
    gap: 0.35rem;
  }
}

@media (max-width: 600px) {
  .top-nav {
    padding: 0.4rem 0;
  }

  .top-nav-actions {
    gap: 0.3rem;
    flex-wrap: nowrap;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }

  .top-nav-actions::-webkit-scrollbar {
    display: none;
  }
}
```

- [ ] **Step 3: Verify visual result**

Run: `cd frontend && npm run dev`
Resize to <600px to verify actions remain accessible without wrapping awkwardly.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/layout/AppTopBar/AppTopBar.vue
git commit -m "style: improve action icon spacing on mobile"
```

---

### Task 4: Search Input Placeholder Truncation

**Covers:** Prevent search placeholder from overflowing on small screens

**Files:**
- Modify: `frontend/src/components/layout/AppSearchBar.vue:478-485`

**Interfaces:**
- Consumes: existing `.search-field input` styles
- Produces: truncated placeholder text on narrow screens

- [ ] **Step 1: Update input CSS**

Add `text-overflow: ellipsis` and `overflow: hidden` to the input field:

```css
.search-field input {
  flex: 1;
  border: none;
  background: transparent;
  color: #474747;
  font-size: 0.875rem;
  line-height: 1.4;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

- [ ] **Step 2: Update placeholder styling**

Replace the placeholder CSS with:

```css
.search-field input::placeholder {
  color: #94a3b8;
  opacity: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 600px) {
  .search-field input {
    font-size: 0.8125rem;
  }

  .search-field input::placeholder {
    content: "Search...";
  }
}
```

- [ ] **Step 3: Verify visual result**

Run: `cd frontend && npm run dev`
Verify placeholder truncates with ellipsis on narrow screens.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/layout/AppSearchBar.vue
git commit -m "style: add placeholder truncation for narrow screens"
```

---

### Task 5: Final Verification

**Covers:** End-to-end responsive behavior verification

**Files:**
- None (verification only)

**Interfaces:**
- Consumes: all changes from Tasks 1-4
- Produces: visual confirmation of responsive behavior

- [ ] **Step 1: Run frontend build**

```bash
cd frontend && npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 2: Visual verification checklist**

Run `npm run dev` and verify at each breakpoint:

| Breakpoint | Logo | Search | Scope | Actions |
|------------|------|--------|-------|---------|
| ≥1200px | 2rem | Inline | Icon + text | All visible |
| 921–1199px | ~1.6rem | Inline | Icon only | All visible |
| 768–920px | ~1.4rem | Row 2 | Icon only | All visible, tighter |
| <768px | ~1.2rem | Row 2 | Icon only | Scrollable overflow |

- [ ] **Step 3: Test functionality**

Verify:
- Search input works and submits
- Scope selector opens/closes
- Post menu works
- Notification/message panels work
- User menu works

- [ ] **Step 4: Commit (if any fixes needed)**

```bash
git add -A
git commit -m "style: responsive top bar improvements complete"
```

---

## Summary

| Task | Files Modified | Complexity |
|------|----------------|------------|
| 1. Logo Scaling | AppTopBar.vue | Low |
| 2. Search Flex | AppTopBarSearchControls.vue, AppTopBar.vue | Medium |
| 3. Action Spacing | AppTopBar.vue | Low |
| 4. Placeholder | AppSearchBar.vue | Low |
| 5. Verification | None | Low |

**Total estimated time:** 15-20 minutes
