# Vấn đề còn lại — Chưa xử lý

Các vấn đề tồn đọng sau khi hoàn thành dark-mode refactor (commit `020e30c`).

## AccountView.vue

### 1. `profileLocation` computed dư thừa (dòng 31) [x]
```js
const profileLocation = computed(() => user.value?.location || '')
```
Chỉ dùng 1 lần trong template (prop `:profile-location`). Có thể dùng inline `user?.location || ''` thay vì computed.

### 2. `activeType.value = ''` gán 2 lần (dòng 225)
Trong `loadUserArtworks()`:
- Dòng 218: `activeType.value = ''` — nằm sau khi gán `artworksPage.value = 1`
- Dòng 225: `activeType.value = ''` — gán lại (redundant)

### 3. `await` trên synchronous return (dòng 406)
```js
return await { ...authStore.user }
```
`await` không có effect vì object literal không phải promise. Chỉ cần `return { ...authStore.user }`.

### 4. Thiếu `aria-live` cho loading/error state [x]
Khi `profileLoading` hoặc `profileError` thay đổi, screen reader không được thông báo. Nên thêm `aria-live="polite"` trên container.

## AccountProfileSection.vue

### 5. `overflow: hidden` clip tooltip/dropdown (dòng 303) [x]
```css
.profile-page {
  overflow: hidden;
}
```
`overflow: hidden` có thể cắt các tooltip, dropdown, sticky elements bên trong. Nên đổi thành `overflow: clip` hoặc xoá nếu không cần thiết.

### 6. Prop drilling: 35 props + 16 emits
`AccountProfileSection` nhận 35 props và emit 16 events, phần lớn pass thẳng xuống sub-component mà không xử lý. Nên dùng `provide/inject` hoặc Pinia store để giảm tải.

### 7. Template lặp 54 dòng (Illustrations / Manga / Novels)
3 tab sections gần như giống hệt, chỉ khác:
- `heading` ("Illustrations" / "Manga" / "Novels")
- `series` filter (`s.type === 'illust'` / `'manga'` / `'novel'`)

Có thể dùng `v-for` với config array để giảm code.

## Ghi chú
- Các vấn đề 1-5 là low/very-low priority, không ảnh hưởng chức năng
- Vấn đề 6-7 là architectural, cần refactor lớn hơn
- Không có blocking issues
