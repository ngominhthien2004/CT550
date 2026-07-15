# Trang Đánh dấu (BookmarksView) và Trang Yêu thích (FavoritesView)

## 1. BookmarksView — Trang Đánh dấu

### Tổng quan

`BookmarksView` hiển thị danh sách tác phẩm mà người dùng đã đánh dấu (bookmark). Trang này thực chất chuyển hướng (redirect) đến `/account?tab=bookmarks` để tái sử dụng giao diện cài đặt tài khoản với tab bookmarks được chọn sẵn.

Hình 1: Giao diện trang Bookmarks trong tab tài khoản.

### Route

| Route | Hành vi |
|-------|---------|
| `/bookmarks` | Redirect → `/account?tab=bookmarks` |

### Tính năng

- **Quản lý thư mục**: Người dùng có thể tổ chức bookmark vào các thư mục riêng.
- **Bookmark store (Pinia)**: Dữ liệu bookmark được quản lý tập trung qua store, hỗ trợ caching và đồng bộ.
- **Thêm/Xoá bookmark**: Có thể thực hiện trực tiếp từ trang chi tiết tác phẩm hoặc từ các trang danh sách.

### Tương tác

- Click vào tác phẩm → điều hướng đến trang chi tiết.
- Click vào thư mục → lọc bookmark theo thư mục.
- Icon bookmark → xoá bookmark khỏi danh sách.

---

## 2. FavoritesView — Trang Yêu thích

### Tổng quan

`FavoritesView` hiển thị danh sách tất cả tác phẩm mà người dùng đã thích (like). Đây là trang riêng biệt với bộ lọc và thống kê đầy đủ.

Hình 2: Giao diện trang Yêu thích với các tab loại tác phẩm.

### Route

| Route | Mô tả |
|-------|-------|
| `/favorites` | Danh sách tác phẩm yêu thích |

### Các tab loại tác phẩm

Người dùng có thể lọc theo loại:

- **Tất cả (All)**: Hiển thị tất cả tác phẩm yêu thích.
- **Illustration**: Chỉ hiển thị illustration.
- **Manga**: Chỉ hiển thị manga.
- **Novel**: Chỉ hiển thị tiểu thuyết.
- **GIF**: Chỉ hiển thị truyện tranh động.

### Cách hiển thị

Mỗi thẻ tác phẩm yêu thích hiển thị:

- **Cover image**: Hình ảnh bìa của tác phẩm.
- **Title**: Tiêu đề tác phẩm.
- **Type**: Loại tác phẩm (Illustration, Manga, Novel, GIF) — hiển thị dưới dạng badge.
- **Age rating**: Mức độ nội dung (All / R-18).
- **Author**: Tên tác giả.
- **Like count**: Số lượt thích của tác phẩm.

### Hành động

| Hành động | Mô tả |
|-----------|-------|
| **Remove** (nút X) | Xoá tác phẩm khỏi danh sách yêu thích — unlike. |
| **Delete latest** | Nút xoá lượt thích gần nhất (tuỳ chọn hàng loạt). |

### Thống kê

- **Total favorite items**: Tổng số tác phẩm yêu thích.
- **Total likes on current filter**: Tổng số lượt thích trên bộ lọc hiện tại.

### Trạng thái rỗng

Khi chưa có tác phẩm yêu thích nào:

- Biểu tượng trái tim trống.
- Thông báo "Bạn chưa thích tác phẩm nào".
- Liên kết khám phá tác phẩm (`/discovery`).

Hình 3: Trang Yêu thích ở trạng thái rỗng.
