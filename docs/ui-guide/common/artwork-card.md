# Thẻ Tác phẩm (ArtworkCard)

## Tổng quan

`ArtworkCard` là component hiển thị một tác phẩm dưới dạng thẻ (card), được sử dụng rộng rãi trên nhiều trang khác nhau như trang chủ, trang khám phá, trang tìm kiếm và trang yêu thích.

Hình 1: ArtworkCard hiển thị trong lưới tác phẩm.

## Props

| Prop | Kiểu | Bắt buộc | Mô tả |
|------|------|----------|-------|
| `item` | Object | Có | Đối tượng tác phẩm chứa đầy đủ thông tin |

### Cấu trúc đối tượng `item`

```javascript
{
  _id: String,          // ID tác phẩm
  title: String,        // Tiêu đề
  type: String,         // "illust" | "manga" | "gif" | "novel"
  ageRating: String,    // "all" | "r-18"
  images: [String],  // Mảng URL hình ảnh
  user: {               // Thông tin tác giả
    _id: String,
    username: String,
    displayName: String,
    avatar: String
  },
  stats: {              // Thống kê
    likeCount: Number,
    bookmarkCount: Number,
    viewCount: Number
  }
}
```

## Giao diện

### Hình ảnh bìa (Cover Image)

- Hiển thị hình ảnh đầu tiên từ mảng `images`.
- **Lazy loading**: Sử dụng thuộc tính `loading="lazy"` cho thẻ `<img>`.
- **Tỉ lệ khung hình**: Duy trì tỉ lệ gốc, sử dụng `object-fit: cover`.
- **Điều chỉnh**: Nếu là manga, hiển thị badge "N trang" ở góc.

### Thông tin tác phẩm

| Thông tin | Hiển thị |
|-----------|----------|
| **Title** | Tiêu đề tác phẩm, in đậm, xuống dòng nếu dài |
| **Author name** | Tên tác giả + avatar nhỏ bên cạnh |
| **Stats** | Hàng icon: ♥ số lượt thích, 🔖 số lượt đánh dấu |

### Badge

- **Loại tác phẩm**: Badge nhỏ ở góc trên (Illust, Manga, GIF, Novel).
- **R-18**: Badge màu đỏ "R-18" cho tác phẩm người lớn.

### R18BlurOverlay

Khi tác phẩm có `ageRating = "r18"`, một lớp phủ làm mờ (blur overlay) được áp dụng:

- Hiệu ứng **blur(30px)** lên hình ảnh.
- Hàng chữ "R-18 — Nhấp để xem" ở giữa.
- Khi nhấp vào, blur được gỡ bỏ (tuỳ chọn xác nhận độ tuổi).

## Liên kết

- Toàn bộ thẻ là một liên kết đến `/artworks/:id`.
- Click chuột phải → mở trong tab mới.

## Lưới đáp ứng (Responsive Grid)

ArtworkCard được thiết kế để hoạt động trong lưới CSS grid tự động:

| Kích thước màn hình | Số cột |
|--------------------|--------|
| ≥ 1200px | 4-5 cột |
| 920px – 1199px | 3-4 cột |
| 600px – 919px | 2-3 cột |
| < 600px | 2 cột |

## Hành vi tương tác

- **Hover**: Hình ảnh phóng to nhẹ (scale 1.02) + đổ bóng (box-shadow).
- **Click**: Điều hướng đến trang chi tiết tác phẩm.
- **Focus**: Outline khi tab vào thẻ (accessibility).

## Các biến thể

| Biến thể | Mô tả |
|----------|-------|
| **Mặc định** | Thẻ đầy đủ: hình + thông tin + stats |
| **Compact** | Chỉ hình ảnh + tiêu đề (dùng trong dải ngang) |
| **Skeleton** | Trạng thái loading dạng xương cá (pulse animation) |

Hình 2: ArtworkCard với R18BlurOverlay đang hoạt động.
