# Trang Tìm kiếm (SearchResultsView)

## Tổng quan

Trang tìm kiếm cho phép người dùng tìm kiếm tác phẩm và người dùng trong hệ thống IlluWrl với nhiều bộ lọc nâng cao. Kết quả được hiển thị dạng lưới (grid) cho tác phẩm hoặc dạng danh sách cho người dùng.

Hình 1: Giao diện trang tìm kiếm với kết quả illustration.

## Các tab loại tìm kiếm

Trang tìm kiếm có bốn tab chính:

| Tab | Route | Mô tả |
|-----|-------|-------|
| **Illustrations** | `/search?type=illust` | Tìm kiếm illustration |
| **Manga** | `/search?type=manga` | Tìm kiếm truyện tranh |
| **Novels** | `/search?type=novel` | Tìm kiếm tiểu thuyết |
| **User** | `/search/users` | Tìm kiếm người dùng |

## Các thành phần

### SearchResultHeader

- Hiển thị từ khoá tìm kiếm hiện tại.
- Gợi ý tag liên quan.
- Nút yêu thích tag (favorite tag toggle) — lưu trạng thái vào localStorage.

### SearchFilterBar

Thanh lọc kết quả với các tuỳ chọn:

| Bộ lọc | Giá trị | Mô tả |
|--------|---------|-------|
| **Sắp xếp** | Mới nhất (Newest) / Phổ biến (Popular) | Thứ tự hiển thị kết quả |
| **Độ tuổi** | Tất cả (All) / An toàn (Safe) / R-18 | Lọc theo mức độ nội dung |
| **Số từ (Novel)** | Bộ lọc đặc thù cho novel | Lọc theo độ dài tiểu thuyết |

### UserSearchFilters (dành cho tìm kiếm người dùng)

- Bộ lọc vai trò (role): Tất cả, Người dùng, Admin.
- Chế độ sắp xếp: Liên quan nhất, Mới nhất, Nhiều tác phẩm nhất.

### ArtworkSearchResults

- Lưới thẻ tác phẩm dạng card (ArtworkCard).
- Phân trang với số trang thông minh (có dấu "...").

### NovelSearchResults

- Danh sách dạng hàng dọc với các tuỳ chọn sắp xếp riêng.
- Hiển thị tiêu đề, tác giả, số chương, độ dài, ngày đăng.

### UserSearchResults

- Thẻ người dùng dạng card: avatar, tên hiển thị, username, số người theo dõi, số tác phẩm.
- Hành động: **Follow** / **Block**.

## SearchOptionsModal

Modal tìm kiếm nâng cao với các tuỳ chọn:

| Tuỳ chọn | Mô tả |
|-----------|-------|
| **Include all (AND)** | Tác phẩm chứa tất cả từ khoá |
| **Include any (OR)** | Tác phẩm chứa bất kỳ từ khoá nào |
| **Exclude** | Từ khoá loại trừ |
| **Target field** | Trường tìm kiếm: Tags, Title, Description, Artist |

## Trạng thái giao diện

| Trạng thái | Mô tả |
|------------|-------|
| **Loading** | Skeleton cards với hiệu ứng pulse |
| **Error** | Thông báo lỗi với biểu tượng và nút thử lại |
| **Empty** | Thông báo "Không tìm thấy kết quả" với gợi ý thay đổi từ khoá |

Hình 2: Modal tìm kiếm nâng cao (SearchOptionsModal).

## Hành vi tương tác

- **Gõ từ khoá**: Tìm kiếm được thực thi khi nhấn Enter hoặc nhấp nút tìm kiếm.
- **Thay đổi tab**: Giữ lại từ khoá, thay đổi loại tìm kiếm.
- **Click tag gợi ý**: Thêm tag vào từ khoá tìm kiếm.
- **Toggle yêu thích tag**: Lưu tag yêu thích vào localStorage để ưu tiên hiển thị.
