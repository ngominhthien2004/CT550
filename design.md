# IlluWrl Design System

AI context document for the IlluWrl project design system. Scannable reference for tokens, classes, and patterns.

---

## 1. Design Tokens

### Light Theme (`:root`)

| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | `#f6f9fd` | Page background |
| `--text` | `#172033` | Primary text |
| `--muted` | `#54607b` | Secondary/muted text |
| `--line` | `#d8e1ef` | Borders and dividers |
| `--brand` | `#0f172a` | Brand dark / headings |
| `--surface` | `#ffffff` | Card/panel surface |
| `--surface-alt` | `#edf3fb` | Alternate surface / hover bg |
| `--radius` | `14px` | Global default radius |
| `--ring` | `#ffd27f` | Focus ring / highlight |
| `--accent` | `#0096fa` | Primary accent / interactive |
| `--accent-hover` | `#2563eb` | Accent hover state |
| `--danger` | `#dc2626` | Error / delete / destructive |
| `--shadow-sm` | `0 1px 3px rgba(15,23,42,0.08)` | Small shadow |
| `--shadow-md` | `0 4px 12px rgba(15,23,42,0.1)` | Medium shadow |
| `--shadow-lg` | `0 10px 26px rgba(15,23,42,0.1)` | Large shadow |

### Dark Theme (`:root.dark-theme`)

| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | `#0f1318` | Page background |
| `--text` | `#e2e8f0` | Primary text |
| `--muted` | `#94a3b8` | Secondary/muted text |
| `--line` | `#2d3748` | Borders and dividers |
| `--brand` | `#f1f5f9` | Brand dark / headings |
| `--surface` | `#1a202c` | Card/panel surface |
| `--surface-alt` | `#2d3748` | Alternate surface / hover bg |
| `--ring` | `#eab308` | Focus ring / highlight |
| `--accent` | `#3b82f6` | Primary accent / interactive |
| `--accent-hover` | `#60a5fa` | Accent hover state |
| `--danger` | `#fc8181` | Error / delete / destructive |
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,0.3)` | Small shadow |
| `--shadow-md` | `0 4px 12px rgba(0,0,0,0.35)` | Medium shadow |
| `--shadow-lg` | `0 10px 26px rgba(0,0,0,0.4)` | Large shadow |

---

## 2. Typography

### Font Stacks

| Context | Stack |
|---------|-------|
| Body | `'Sora', 'Noto Sans', sans-serif` |
| Headings h1–h4 | `'Noto Sans', system-ui, -apple-system, sans-serif` |
| Author card name | `'Outfit', 'Inter', sans-serif` |
| Novel reading area | `'Lora', Georgia, 'Noto Serif', 'Times New Roman', serif` |
| Monospace | `ui-monospace, 'SF Mono', monospace` |

### Google Fonts Imports

- Sora (400, 600, 700)
- Space Grotesk (500, 700)

### Font Size Scale

| Size | Usage |
|------|-------|
| `0.75rem` | Small labels, ghost links, icon buttons |
| `0.78rem` | Card author, timestamps |
| `0.82rem` | Admin buttons, subtabs |
| `0.85rem` | DD items, modal info |
| `0.88rem` | Action pills, inputs |
| `0.9rem` | Section links, card titles |
| `0.95rem` | Sidebar nav links |
| `1rem` | Modal titles, icon buttons |
| `1.1rem` | Panel headings |
| `1.8rem` | Admin page headings |

---

## 3. Color Palette

### Brand / Accent

| Hex | Usage |
|-----|-------|
| `#0f172a` | Brand dark |
| `#0096fa` | Accent (light) |
| `#2563eb` | Accent hover (light), action-pill--post |
| `#3b82f6` | Accent (dark), selection highlight |
| `#60a5fa` | Accent hover (dark), links (dark) |
| `#1695f0` | Auth brand color |

### Status Colors

| Hex | Usage |
|-----|-------|
| `#22c55e` | Success, online dot |
| `#f59e0b` | Warning |
| `#eab308` | Ring (dark), amber |
| `#38bdf8` | Info (admin) |
| `#ef4444` | Like active, error |

### Toast Colors

| Hex | Usage |
|-----|-------|
| `#1f2937` | Default toast bg |
| `#065f46` | Success toast |
| `#991b1b` | Error toast |
| `#1e40af` | Info toast |

### Indigo (Chat Accent)

| Value | Usage |
|-------|-------|
| `rgba(99,102,241,0.1)` | Thread active, compose focus ring |
| `rgba(99,102,241,0.15)` | Drag-drop overlay |
| `rgba(99,102,241,0.2)` | Outgoing message bubble |
| `rgba(99,102,241,0.3)` | Outgoing bubble border |

---

## 4. Spacing & Layout

### Common Gap Values

| Range | Usage |
|-------|-------|
| `0.35–0.5rem` | Tight gaps (inline items, bubble images) |
| `0.5–0.6rem` | Medium gaps (cards, sidebar items) |
| `0.7–0.75rem` | Standard gaps (panels, grids) |
| `1–1.5rem` | Section spacing |

### Border Radius Scale

| Value | Usage |
|-------|-------|
| `4px` | Badges, checkboxes |
| `6px` | Inputs, DD items, small buttons |
| `8px` | DD panels, info boxes, thumbnails |
| `10px` | Icon buttons, sidebar nav links |
| `12px` | Cards, modals, bubbles |
| `14px` | `--radius` global, admin panels |
| `16px` | Page blocks, main content |
| `20px` | Compose input wrapper |
| `22px` | Auth card |
| `999px` | Pill buttons, avatars, badges |

---

## 5. Component Patterns

### Shared CSS Files (`frontend/src/assets/styles/`)

All imported via `<style scoped src="...">` in Vue SFCs.

| File | Classes | Consumers |
|------|---------|-----------|
| `global.css` | Root tokens, `.page-block`, `.section-head` | `main.js` (global) |
| `buttons.css` | `.action-pill`, `.icon-btn`, `.icon-round`, `.ghost-link` | `main.js` (global) |
| `avatars.css` | `.avatar` with size modifiers | `main.js` (global) |
| `dropdown.css` | `.dd-panel`, `.dd-item`, `.dd-separator` | 9+ components |
| `quick-panel.css` | `.quick-panel`, `.quick-panel-box` | Notification/Message panels |
| `upload-form.css` | `.row-left`, `.custom-input`, `.custom-radio` | Upload components |
| `dashboard-panel.css` | `.menu-dropdown-item`, `.card-menu-btn` | Dashboard panels |
| `modal.css` | `.modal-backdrop`, `.modal-card` | Profile modals |
| `auth.css` | `.auth-shell`, `.auth-card` | Login/SignUp views |

### Shared CSS Import Pattern

```vue
<style scoped src="../../assets/styles/dropdown.css"></style>
<style scoped>
  /* component-specific sizing overrides */
  .dd-panel .dd-item { padding: 0.55rem 0.75rem; font-size: 0.82rem; }
</style>
```

**IMPORTANT:** Shared CSS and component scoped CSS get different `data-` attribute hashes. Component overrides must use component-specific selectors for proper specificity.

### Button Classes

| Class | Style |
|-------|-------|
| `.action-pill` | Pill button: `border-radius: 999px`, border, `font-weight: 700` |
| `.action-pill--post` | Blue solid: bg `#3b82f6` |
| `.action-pill--small` | Compact variant |
| `.icon-btn` | 36×36 square, `border-radius: 10px` |
| `.icon-btn.ghost` | Surface-alt bg variant |
| `.icon-round` | 36×36 circle |
| `.ghost-link` | Transparent, muted text |

### Card Patterns

- **Artwork Card**: 12px radius cover, 18×18 avatar, `.card-title` (0.9rem bold), `.card-author` (0.78rem muted)
- **Work Card**: 12px radius, 1:1 aspect thumbnail
- **Follow Card**: Top border separator, 46×46 avatar, 4-col preview grid (8px radius)
- **Overview Card**: 12px radius, hover `translateY(-2px)`

### Dropdown Pattern (`.dd-panel`)

```css
.dd-panel {
  position: absolute; top: 100%; right: 0; margin-top: 6px;
  min-width: 160px; background: var(--surface);
  border: 1px solid var(--line); border-radius: 8px;
  box-shadow: var(--shadow-md); z-index: 1000;
  padding: 0.25rem 0; display: flex; flex-direction: column;
}
.dd-item {
  display: flex; align-items: center; gap: 0.46rem;
  padding: 0.5rem 0.85rem; font-size: 0.85rem;
  color: var(--text); border: none; background: none;
  width: 100%; text-align: left; cursor: pointer;
  border-radius: 6px; transition: background 0.12s;
}
.dd-item:hover { background: var(--surface-alt); }
.dd-item.is-active { color: var(--accent); font-weight: 600; }
.dd-item--danger { color: var(--danger); }
.dd-item--danger:hover { background: rgba(220,38,38,0.08); }
.dd-separator { height: 1px; background: var(--line); margin: 0.2rem 0; }
```

---

## 6. Icon Conventions

**Library:** Font Awesome 6 Free (imported in `main.js`)

| State | Style |
|-------|-------|
| Active/functional | `fa-solid fa-*` |
| Inactive/default | `fa-regular fa-*` |
| Social media | `fa-brands fa-*` |

### Common Mappings

| Action | Off | On |
|--------|-----|-----|
| Like | `fa-regular fa-heart` | `fa-solid fa-heart` |
| Bookmark | `fa-regular fa-bookmark` | `fa-solid fa-bookmark` |
| Report | `fa-regular fa-flag` | `fa-solid fa-flag` |
| More | `fa-solid fa-ellipsis` | — |
| Close | `fa-solid fa-xmark` | — |
| Search | `fa-solid fa-magnifying-glass` | — |
| Back | `fa-solid fa-arrow-left` | — |
| Block | `fa-solid fa-ban` | — |

---

## 7. Dark Theme

**Implementation:** `composables/useTheme.js`

- Stores preference in localStorage key `illuwrl-theme`
- Toggles `dark-theme` class on `<html>`
- All tokens overridden via `:root.dark-theme { ... }`
- Toggle in `AppTopBarUserMenu` dropdown

### Dark-Specific Overrides

- Body bg: radial-gradient overlays + `var(--bg)`
- `#app`: `rgba(15,23,42,0.85)`
- Selection: background `#3b82f6`, color `#fff`
- Scrollbar: track `#1a202c`, thumb `#4a5568`
- Links: `#60a5fa`

---

## 8. Bootstrap Usage

Bootstrap 5 imported globally. Commonly used:

| Category | Classes |
|----------|---------|
| Layout | `d-grid`, `d-flex`, `d-none`, `d-inline-flex` |
| Flexbox | `justify-content-between`, `align-items-center` |
| Spacing | `gap-1`, `gap-2`, `mb-0`, `mb-2`, `p-3` |
| Forms | `form-control`, `form-select`, `form-check` |
| Buttons | `btn`, `btn-primary`, `btn-outline-*`, `btn-sm` |
| Table | `table`, `table-sm`, `align-middle` |

---

## 9. Responsive Breakpoints

| Width | Effect |
|-------|--------|
| `600px` | Top bar compact |
| `920px` | Sidebar collapses, main content full-width |
| `1200px` | Work grid 4-col, main content margins |

---

## 10. Animation Patterns

- **Transitions:** `0.12s` (hover), `0.2s` (focus/expand), `0.25s` (slide/toast)
- **Loading:** Shimmer animation on skeleton elements
- **Modals:** fadeIn + slideUp entrance
- **Reduced motion:** `@media (prefers-reduced-motion: reduce)` disables transitions

---

## 11. Layout Structure

### MainLayoutTemplate.vue

```
.app-layout
  .sidebar-backdrop (mobile, z-index: 1039)
  AppSidebarMenu (fixed left, 240px, z-index: 1040)
  .main-pane (margin-left: 240px)
    AppTopBar (.top-nav.page-block, height: 72px)
    .main-content (margin: 0 72px, gap: 0.7rem)
      <slot />
```

### Page Block Pattern

```css
.page-block {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 16px;
}
```

### Panel Pattern

```css
.panel {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 0.9rem;
}
```

---

## 12. Utility Patterns

### Avatar Sizes

```css
.avatar { --avatar-size: 40px; border-radius: 9999px; }
.avatar--xs { --avatar-size: 30px; }
.avatar--sm { --avatar-size: 40px; }
.avatar--md { --avatar-size: 48px; }
.avatar--lg { --avatar-size: 64px; }
.avatar--xl { --avatar-size: 100px; }
```

### Switch Toggle

```css
.switch { width: 34px; height: 20px; border-radius: 999px; background: var(--muted); }
.switch-knob { width: 16px; height: 16px; border-radius: 999px; background: var(--surface); }
.switch.active { background: var(--accent); }
.switch.active .switch-knob { transform: translateX(14px); }
```

### Empty State

```css
.empty-state {
  border: 1px dashed var(--line);
  border-radius: 18px;
  padding: 0.9rem;
  color: var(--muted);
  background: var(--surface);
}
```

### Toast Notifications

```css
.toast-item { background: #1f2937; color: #fff; border-radius: 12px; }
.toast--success { background: #065f46; }
.toast--error { background: #991b1b; }
.toast--info { background: #1e40af; }
```

### Skeleton Loading

```css
.skeleton-image, .skeleton-line, .skeleton-avatar {
  background: linear-gradient(90deg, var(--line) 25%, var(--surface-alt) 50%, var(--line) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
```
