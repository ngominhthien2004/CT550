# Trang Chi tiết Tác phẩm (ArtworkDetailView)

## Tổng quan

`ArtworkDetailView` hiển thị thông tin chi tiết của một tác phẩm (illustration, manga, GIF) hoặc tiểu thuyết (novel). Trang này là trung tâm tương tác — người dùng có thể xem, thích, đánh dấu, bình luận và khám phá các tác phẩm liên quan.

Hình 1: Giao diện trang chi tiết tác phẩm với viewer và sidebar.

## Route

| Route | Loại |
|-------|------|
| `/artworks/:id` | Illustration, Manga, GIF |
| `/novels/:id` | Tiểu thuyết (Novel) |

## Các thành phần chính

### 1. ArtworkDetailViewer — Trình xem tác phẩm

| Loại | Hành vi |
|------|---------|
| **Illustration** | Hiển thị hình ảnh toàn màn hình, hỗ trợ zoom |
| **Manga** | Trình xem nhiều trang, chuyển trang bằng click hoặc phím mũi tên |
| **GIF** | Phát tự động, có điều khiển phát/dừng |

- **Chế độ toàn màn hình**: Nút expand để xem ở chế độ fullscreen.
- **Zoom**: Cuộn để phóng to/thu nhỏ, kéo để di chuyển.

### 2. ArtworkDetailSidebar — Thanh bên thông tin

Hiển thị các thông tin và thao tác chính:

- Tiêu đề tác phẩm
- Loại tác phẩm và độ tuổi (All / R-18)
- Ngày đăng, số lượt xem

### 3. ArtworkDetailCaption — Mô tả tác phẩm

- Tiêu đề (lớn, đậm).
- Mô tả (caption) của tác giả.
- Danh sách tag — mỗi tag là liên kết đến trang tìm kiếm.
- Nút sao chép link tác phẩm.

### 4. ArtworkDetailAuthorRow — Dòng thông tin tác giả

- Avatar tác giả + tên hiển thị + username.
- Nút **Follow** / **Unfollow**.
- Liên kết đến trang người dùng của tác giả.

### 5. ArtworkDetailCommentsCard — Khu vực bình luận

- Sử dụng component `CommentList` để hiển thị bình luận.
- Ô nhập bình luận mới (chỉ cho người dùng đã đăng nhập).
- Phân trang bình luận.
- Xoá bình luận (chủ sở hữu hoặc admin).

### 6. ArtworkDetailRelatedGrid — Tác phẩm liên quan

- Hiển thị các tác phẩm tương tự dựa trên **collaborative filtering**.
- Tối đa 6-12 tác phẩm liên quan.
- Sử dụng component `ArtworkCard`.

### 7. ArtworkDetailWorksStrip — Tác phẩm khác của cùng tác giả

- Dải ngang các tác phẩm khác của cùng tác giả.
- Vuốt ngang (horizontal scroll) trên thiết bị di động.

### 8. NovelRelatedCard — Thẻ tiểu thuyết liên quan (cho novels)

- Hiển thị novel liên quan trong cùng thể loại.

## Thanh công cụ hành động (Action Toolbar)

| Hành động | Biểu tượng | Mô tả |
|-----------|-----------|-------|
| **Like (Thích)** | ♥ / ❤ | Thích hoặc bỏ thích tác phẩm |
| **Bookmark (Đánh dấu)** | 🔖 | Đánh dấu hoặc bỏ đánh dấu |
| **Report (Báo cáo)** | ⚠ | Báo cáo tác phẩm vi phạm |

## Tính năng đặc thù cho Novel

- **Theo dõi tiến độ đọc (reading progress)**: Lưu vị trí đọc cuối cùng, tự động khôi phục khi quay lại.
- **Bộ chọn chương (Chapter selector)**: Dropdown chọn chương cho novel nhiều chương.

## Responsive

| Kích thước | Hành vi |
|------------|---------|
| ≥ 1200px | Viewer bên trái, sidebar thông tin bên phải |
| 920px – 1199px | Sidebar thu hẹp |
| < 920px | Viewer và thông tin xếp dọc, sidebar xuống dưới |

Hình 2: Trang chi tiết novel với chapter selector và reading progress.
