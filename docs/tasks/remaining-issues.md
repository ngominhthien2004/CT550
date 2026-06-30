# Vấn đề còn lại — Chưa xử lý

Last updated: 2026-06-30

Các vấn đề tồn đọng sau khi hoàn thành dark-mode refactor (commit `020e30c`).

## AccountView.vue

### 1. ~~`profileLocation` computed dư thừa~~ [x] RESOLVED
`computed` đã bị xoá. Template dùng inline `user?.location || ''` trực tiếp (dòng 584).

### 2. ~~`activeType.value = ''` gán 2 lần~~ [x] RESOLVED (false positive)
Hai lần gán nằm ở code path riêng biệt — dòng 217 (early return guard) và dòng 225 (normal flow sau khi reset page). Không redundancy thực sự.

### 3. ~~`await` trên synchronous return~~ [x] RESOLVED
Code hiện tại dùng `profileUser.value = authStore.user` + `return` — không còn `await` trên object literal.

### 4. ~~Thiếu `aria-live` cho loading/error state~~ [x] RESOLVED
Đã thêm `<div aria-live="polite">` bọc quanh loading/error messages trong `AccountProfileSection.vue` (dòng 141-144).

## AccountProfileSection.vue

### 5. ~~`overflow: hidden` clip tooltip/dropdown~~ [x] RESOLVED
Đã đổi thành `overflow: clip` trong `.profile-page` (dòng 271). `clip` hoạt động tương tự `hidden` nhưng không tạo scroll container, tránh cắt dropdown/tooltip.

### 6. ~~Prop drilling: 46 props + 20 emits~~ [x] RESOLVED
Hoàn thành refactor bằng cách:
- Tạo `composables/useProfilePage.js` — đóng gói tất cả state, computed, actions
- `AccountView.vue` sử dụng composable và `provide()` tất cả state/functions
- `AccountProfileSection.vue` — xoá toàn bộ props/emits, dùng `inject()` để lấy state
- Sub-components (`ProfileCoverBanner`, `ProfileSummarySection`, `ProfilePrimaryTabs`, modals) — dùng `inject()` thay vì props
- `ArtworkGridSection` giữ nguyên props (generic component), events handled by parent via injected functions

**Kết quả:** 0 props + 0 emits trên AccountProfileSection. Sub-components cũng giảm đáng kể props.

### 7. ~~Template lặp 54 dòng~~ [x] RESOLVED
Đã refactor thành `v-for` với config array `workTypeTabs` (dòng 90-94, template dòng 171-190). Chỉ còn ~20 dòng thay vì 54.

## Tổng kết

| # | Vấn đề | Trạng thái | Ưu tiên |
|---|--------|-----------|---------|
| 1 | profileLocation computed | ✅ Resolved | Low |
| 2 | activeType double assign | ✅ False positive | Low |
| 3 | await on sync return | ✅ Resolved | Low |
| 4 | aria-live missing | ✅ Resolved | Medium |
| 5 | overflow: hidden | ✅ Resolved | Low |
| 6 | Prop drilling | ✅ Resolved | Architectural |
| 7 | Template duplication | ✅ Resolved | Medium |

**Tất cả vấn đề đã resolved. Không có blocking issues.**
