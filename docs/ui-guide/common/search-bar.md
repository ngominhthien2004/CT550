# Thanh Tìm kiếm (Search Components)

## Tổng quan

IlluWrl có hệ thống tìm kiếm linh hoạt với nhiều component phục vụ các mục đích khác nhau, tích hợp trên thanh điều hướng và các trang kết quả.

---

## 1. AppTopBarSearchControls

### Mô tả

Component tìm kiếm chính nằm trên `AppTopBar`, luôn hiển thị trên mọi trang có sử dụng MainLayoutTemplate.

Hình 1: AppTopBarSearchControls với scope selector và ô nhập.

### Cấu trúc

| Thành phần | Mô tả |
|------------|-------|
| **Scope selector** | Dropdown chọn phạm vi: Illustrations, Manga, GIF, Novels, User |
| **Input field** | Ô nhập văn bản, placeholder thay đổi theo scope |
| **Search options button** | Nút bánh răng (⚙) mở SearchOptionsModal |
| **Execute button** | Nút kính lúp (🔍) thực thi tìm kiếm |

### Hành vi

- **Chọn scope User**: Input chuyển thành placeholder "Tìm người dùng...", khi tìm kiếm → điều hướng đến `/search/users?q=...`.
- **Chọn scope khác**: Điều hướng đến `/search?type=...&q=...`.
- **Phím Enter**: Thực thi tìm kiếm với scope hiện tại.

---

## 2. AppSearchBar & AppSearchHistoryPanel

### Mô tả

Component tìm kiếm độc lập, thường được sử dụng trên trang tìm kiếm hoặc các trang có chức năng tìm kiếm riêng.

- **AppSearchBar**: Ô nhập tìm kiếm với icon và nút xoá.
- **AppSearchHistoryPanel**: Dropdown hiển thị lịch sử tìm kiếm gần đây.

### Lịch sử tìm kiếm

- Lưu vào localStorage (quản lý qua `useSearchHistory` composable).
- Hiển thị tối đa 10 mục gần nhất.
- Có thể xoá từng mục hoặc xoá toàn bộ.
- Không lưu các tìm kiếm trùng lặp.

---

## 3. SearchOptionsModal

### Mô tả

Modal tìm kiếm nâng cao cho phép người dùng tuỳ chỉnh chi tiết truy vấn.

Hình 2: SearchOptionsModal với các trường tìm kiếm nâng cao.

### Cấu trúc

| Trường | Mô tả |
|--------|-------|
| **Include all (AND)** | Các từ khoá bắt buộc — tác phẩm phải chứa tất cả |
| **Include any (OR)** | Các từ khoá tuỳ chọn — tác phẩm chứa bất kỳ từ nào |
| **Exclude** | Các từ khoá loại trừ — tác phẩm không được chứa |
| **Target field** | Trường tìm kiếm: `tag_partial`, `tag_exact`, `title`, `title_caption`, `all` |

### Hành vi

- Mở từ nút ⚙ trên AppTopBarSearchControls.
- Đóng khi nhấp ra ngoài hoặc nhấn nút Đóng.
- Khi Apply: cập nhật query parameters và thực thi tìm kiếm.

---

## 4. Scope Selector Chi tiết

| Scope | Icon | Placeholder | Route |
|-------|------|-------------|-------|
| Illustrations | 🖼 | "Tìm illustration..." | `/search?type=illust` |
| Manga | 📖 | "Tìm manga..." | `/search?type=manga` |
| GIF | 🎞 | "Tìm GIF..." | `/search?type=gif` |
| Novels | 📝 | "Tìm novel..." | `/search?type=novel` |
| User | 👤 | "Tìm người dùng..." | `/search/users` |

## Props và Events

Các component search sử dụng `v-model` cho giá trị input và emit events khi submit.

| Event | Mô tả |
|-------|-------|
| `@search` | Được emit khi người dùng thực thi tìm kiếm |
| `@scope-change` | Được emit khi thay đổi scope |
| `@clear` | Được emit khi xoá input |
