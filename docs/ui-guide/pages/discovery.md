# Trang Khám phá (DiscoveryView) và Duyệt theo Tag

## 1. DiscoveryView — Trang Khám phá

### Tổng quan

`DiscoveryView` cho phép người dùng khám phá tác phẩm ngẫu nhiên và duyệt theo thể loại. Trang này cung cấp giao diện khám phá trực quan với nhiều bộ lọc.

Hình 1: Giao diện trang Khám phá với các tab loại tác phẩm.

### Route

| Route | Mô tả |
|-------|-------|
| `/discovery` | Khám phá tác phẩm |

### Các tab loại tác phẩm

| Tab | Mô tả |
|-----|-------|
| **Illustrations** | Khám phá illustration |
| **Manga** | Khám phá truyện tranh |
| **GIF** | Khám phá truyện tranh động |
| **Novels** | Khám phá tiểu thuyết |

### Bộ lọc R-18

Lọc theo mức độ nội dung:

- **All (Tất cả)**: Hiển thị tất cả tác phẩm.
- **R-18**: Chỉ hiển thị tác phẩm có nội dung người lớn.
- Hiển thị dưới dạng nút dạng viên thuốc (pill buttons).

### Lưới tác phẩm

- Sử dụng component `ArtworkCard` để hiển thị từng tác phẩm.
- Bố trí dạng lưới (CSS grid) tự động điều chỉnh số cột.
- Hỗ trợ lazy loading cho hình ảnh.

### Phân trang

- Phân trang dạng số trang thông minh.
- Các trang được nén với dấu "..." (ellipsis).
- Ví dụ: `1 ... 5 6 7 ... 20` khi đang ở trang 6.

### Trạng thái

| Trạng thái | Hiển thị |
|------------|----------|
| **Loading** | Skeleton grid |
| **Error** | Thông báo lỗi + nút thử lại |
| **Empty** | "Không tìm thấy tác phẩm" + gợi ý thay đổi bộ lọc |

---

## 2. Duyệt theo Tag / Thể loại

### Tổng quan

IlluWrl hỗ trợ hệ thống tag đa ngôn ngữ (tiếng Anh, tiếng Việt, tiếng Nhật) giúp người dùng duyệt tác phẩm theo chủ đề.

### Route

| Route | Hành vi |
|-------|---------|
| `/tags/:tagName` | Redirect đến `/search?tag=:tagName` |

### Hệ thống tag

| Tính năng | Mô tả |
|-----------|-------|
| **Đa ngôn ngữ** | Tag có bản dịch en/vi/ja — hiển thị ngôn ngữ phù hợp với người dùng |
| **Tag detail** | Xem thông tin tag qua tag store (Pinia) — số lượng tác phẩm, tác phẩm liên quan |
| **Tag autocomplete** | Gợi ý tag khi nhập trong trang tải lên và tìm kiếm |
| **Tag phổ biến** | Hiển thị trên trang chủ và trang khám phá |

### Tương tác với tag

- **Click vào tag trên tác phẩm**: Điều hướng đến tìm kiếm với tag đó.
- **Yêu thích tag**: Lưu tag vào danh sách yêu thích (localStorage).
- **Tag gợi ý**: Hiển thị tag liên quan khi tìm kiếm.

Hình 2: Hệ thống tag đa ngôn ngữ hiển thị trên thẻ tác phẩm.

## Responsive

| Kích thước | Hành vi |
|------------|---------|
| ≥ 1200px | 4-5 cột artwork grid |
| 920px – 1199px | 3-4 cột |
| 600px – 919px | 2-3 cột |
| < 600px | 2 cột |
