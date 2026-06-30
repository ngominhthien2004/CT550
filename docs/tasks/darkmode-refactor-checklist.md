# Dark Mode & Dead Code Refactor Checklist

Mục tiêu: thay thế hardcoded color bằng CSS variables (`var(--surface)`, `var(--text)`, `var(--muted)`, `var(--line)`, `var(--brand)`) để tương thích dark-mode, xoá dead code, và cleanup setTimeout.

## Cách dùng
- [ ] = chưa làm
- [x] = đã xong
- Mỗi mục bao gồm file cần sửa, mô tả thay đổi, và ghi chú.

---

## Batch 1: Profile components cơ bản

### ProfileCoverBanner.vue
- [x] `border-bottom: 1px solid #e5e7eb` → `var(--line)`
- [ ] Xem xét `color: #fff` (text trên gradient — giữ hay dùng biến)

### ProfilePrimaryTabs.vue
- [x] `border-bottom: 1px solid #edf0f4` → `var(--line)`
- [x] `color: #6b7280` → `var(--muted)`
- [x] `color: #1f2937` (active tab) → `var(--brand)`

### ProfileSummarySection.vue
- [x] `background: #1f2937` (share tooltip) → `var(--surface-alt)` hoặc biến mới
- [x] `.block-btn:hover` màu cảnh báo (`#fef2f2`, `#fca5a5`, `#dc2626`) — xem xét giữ hay dùng biến
- [x] `.blocked-notice` màu cảnh báo — như trên
- [x] `.report-user-btn:hover` màu cảnh báo — như trên
- [x] `setTimeout` trong `handleShare()` thêm `onUnmounted` cleanup

### ArtworkGridSection.vue
- [x] Toàn bộ style: thay `#fff` → `var(--surface)`, `#dbe4ef` → `var(--line)`, `#4b5563` → `var(--muted)`, v.v.

### ProfileSeriesSection.vue
- [x] `background: #fff` → `var(--surface)`
- [x] `border: 1px solid #e5e7eb` → `var(--line)`
- [x] `color: #6b7280` / `#9ca3af` → `var(--muted)`
- [x] `color: #1f2937` → `var(--brand)`
- [x] `background: #f3f4f6` / `#f9fafb` → `var(--surface-alt)`
- [x] `color: #b4bac5` → `var(--muted)`
- [x] `box-shadow` không dùng biến — xem xét

---

## Batch 2: Feature components

### ProfileRequestsSection.vue
- [x] Toàn bộ style: thay `#fff` → `var(--surface)`, `#d8e1ef` → `var(--line)`, `#64748b` → `var(--muted)`, `#172033` → `var(--text)`, `#0096fa` → `var(--accent)`

### BlockedUsersList.vue
- [x] Toàn bộ style: thay `#1f2937` → `var(--brand)`, `#64748b` → `var(--muted)`, `#e2e8f0` → `var(--line)`

---

## Batch 3: Modal components

### ProfileEditModal.vue
- [x] Toàn bộ style: thay `#333` → `var(--text)`, `#ddd` → `var(--line)`, `#f8f9fa` → `var(--surface-alt)`, `#0096fa` → `var(--accent)`

### ProfileCoverModal.vue
- [x] `#f1f5f9` → `var(--surface-alt)`
- [x] `#000` → `var(--text)` hoặc `#000` (hợp lý cho overlay)
- [x] `#666` → `var(--muted)`

### ProfileAvatarModal.vue
- [x] `#f1f5f9` → `var(--surface-alt)`
- [x] `#334155` → `var(--text)`
- [x] `#64748b` → `var(--muted)`

---

## Batch 4: AccountView.vue

### AccountView.vue
- [x] `setTimeout` (3000ms) trong `handleDeleteCover()` thêm `onUnmounted` cleanup
- [x] `document.body.style.overflow` — đồng bộ cho cả edit/cover/avatar modal
