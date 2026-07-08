# Trang Chi tiết Series (SeriesDetailView)

## Tổng quan

`SeriesDetailView` hiển thị thông tin chi tiết của một bộ series — bao gồm hero section, danh sách tác phẩm (artworks grid) hoặc danh sách chương (chapters list) tuỳ theo loại series.

Hình 1: Giao diện trang Chi tiết Series với hero và lưới tác phẩm.

## Route

| Route | Yêu cầu | Mô tả |
|-------|---------|-------|
| `/series/:id` | — | Chi tiết bộ series |

## Các thành phần chính

### 1. Nút quay lại

- Hiển thị mũi tên trái (`fa-arrow-left`) + chữ "Back".
- Gọi `router.back()` để quay lại trang trước.

### 2. SeriesHero — Banner series

- Component `SeriesHero` hiển thị thông tin tổng quan của series: tiêu đề, mô tả, loại tác phẩm, cover image.
- Cover fallback: nếu series không có cover, lấy từ `artworks[0].images[0]`.

### 3. SeriesArtworksGrid — Lưới tác phẩm (cho manga/illust/GIF)

- Hiển thị khi `series.type !== 'novel'`.
- Component `SeriesArtworksGrid` hiển thị danh sách artwork trong series dạng lưới.
- Mỗi artwork có icon tuỳ loại: `fa-book` (manga), `fa-pen-fancy` (novel), `fa-image` (illust).
- Click vào artwork → điều hướng đến `/artworks/:id`.

### 4. SeriesChaptersList — Danh sách chương (cho novel)

- Hiển thị khi `series.type === 'novel'`.
- Component `SeriesChaptersList` hiển thị danh sách chapter của novel series.
- Mỗi chapter hiển thị: tiêu đề, ngày tạo (`MM/DD/YYYY`), số từ (formatted với `toLocaleString()`).
- Chỉ hiển thị khi series có `novelArtwork._id`.
- Owner có thể quản lý chapters (thêm/sửa/xoá).

### 5. Owner actions

- Hiển thị khi `isOwner === true` (so sánh `series.user._id` với `authStore.user._id`).
- Nút "Manage Dashboard" link đến `/dashboard?tab=works`.

## Dữ liệu được tải

| API endpoint | Dữ liệu |
|--------------|---------|
| `seriesStore.fetchSeriesById(id)` | Thông tin series + artworks list |
| `getChapters(novelArtwork._id)` | Danh sách chương (chỉ cho novel) |

## Trạng thái

| Trạng thái | Hiển thị |
|------------|----------|
| **Loading** | "Đang tải series..." |
| **Not found** | "Series not found" + nút "Go back" |
| **Error** | Alert danger với thông báo lỗi |
| **Success** | Alert success (tự đóng sau 3 giây) |

## Tương tác

- **Click artwork** → `/artworks/:id`
- **Click Back** → `router.back()`
- **Click "Manage Dashboard"** → `/dashboard?tab=works` (chỉ owner)
- **Click chapter** → navigate theo cấu hình series

## Responsive

| Kích thước | Hành vi |
|------------|---------|
| ≥ 960px | Max-width 960px, padding đầy đủ |
| < 960px | Padding thu hẹp, content co lại |

## Ghi chú

- Trang sử dụng `vue-i18n` cho đa ngôn ngữ (`$t('artwork.loadingSeries')`, `$t('artwork.seriesNotFound')`, v.v.).
- Series type determine whether to show artworks grid or chapters list.
- Error/alert messages auto-dismiss sau 3 giây (success) hoặc dismissible (error).
