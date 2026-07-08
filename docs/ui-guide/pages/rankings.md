# Trang Bảng xếp hạng (RankingsView)

## Tổng quan

`RankingsView` hiển thị bảng xếp hạng tác phẩm theo mức độ phổ biến. Trang này sử dụng `MainLayoutTemplate` và cho phép người dùng lọc theo loại tác phẩm và khoảng thời gian.

Hình 1: Giao diện trang Bảng xếp hạng với bộ lọc loại và khoảng thời gian.

## Route

| Route | Mô tả |
|-------|-------|
| `/rankings` | Bảng xếp hạng tác phẩm |

Tham số query: `?period=daily&type=all` — đồng bộ hoá với URL để deep link.

## Cấu trúc trang

### 1. RankingFilters — Bộ lọc xếp hạng

#### Tab loại tác phẩm (Type Tabs)

Hiển thị dạng tab ngang, nằm trên cùng:

| Tab | Giá trị | Mô tả |
|-----|---------|-------|
| **Overall** | `all` | Tất cả loại tác phẩm |
| **Illustrations** | `illust` | Chỉ illustration |
| **Manga** | `manga` | Chỉ truyện tranh |
| **Novels** | `novel` | Chỉ tiểu thuyết |

Tab đang active có underline accent (3px, góc bo tròn trên).

#### Thanh khoảng thời gian (Period Bar)

Nằm bên dưới type tabs, gồm hai phần:

| Thành phần | Mô tả |
|------------|-------|
| **Period tabs** | Nhóm nút dạng viên thuốc (pill tabs) trên nền `surface-alt` |
| **Date indicator** | Hiển thị khoảng thời gian tương ứng ở bên phải |

| Period | Giá trị | Label hiển thị |
|--------|---------|----------------|
| **Daily** | `daily` | Ngày hôm qua (ví dụ: "July 7, 2026") |
| **Weekly** | `weekly` | Khoảng 7 ngày (ví dụ: "Jul 1 - Jul 8, 2026") |
| **Monthly** | `monthly` | Khoảng 30 ngày (ví dụ: "June 8 - July 8, 2026") |
| **Rookie** | `rookie` | "All-time rookie artworks" |

Period tab active có nền `surface`, màu accent, và shadow nhẹ.

### 2. Danh sách xếp hạng (Ranking List)

Mỗi tác phẩm hiển thị dưới dạng `RankingItem` — một hàng ngang gồm:

| Thành phần | Mô tả |
|------------|-------|
| **Rank number** | Số thứ tự xếp hạng. Top 1 vàng (#facc15, 32px), top 2 bạc (28px), top 3 đồng (#d97706, 26px), còn lại xám (24px) |
| **Rank trend** | Icon xu hướng (hiện tại hiển thị dấu gạch ngang — "không thay đổi") |
| **Thumbnail** | Ảnh bìa 200×200px, bo tròn 8px, có hover zoom 1.05. Nếu không có ảnh → fallback icon `fa-book-open` trên nền gradient |
| **Title** | Tiêu đề tác phẩm, link đến `/artworks/:id` |
| **Author** | Avatar 24px + tên tác giả, link đến `/users/:id/profile` |
| **Stats row** | Số lượt xem (👁), thích (♥), đánh dấu (🔖) — format ngắn (1.2k, 3.5w) |
| **Actions** | Nút Like (trái tim, có số đếm) + nút Bookmark (dấu trang) |

### 3. Nút Load More

- Hiển thị khi còn trang chưa tải.
- Nền `surface`, border `line`, bo tròn 8px.
- Hover: viền và chữ chuyển sang accent.
- Khi đang tải: hiển thị spinner nhỏ thay vì chữ.

### 4. RankingEmptyState — Trạng thái rỗng

Xử lý 3 trạng thái:

| Trạng thái | Hiển thị |
|------------|----------|
| **Loading** | Spinner xoay (conic gradient accent) ở giữa, chiều cao 300px |
| **Error** | Icon cảnh báo đỏ + "Something went wrong" + thông báo lỗi + nút "Try Again" |
| **Empty** | Icon biểu đồ + "No artworks ranked" + thông báo theo period + gợi ý chuyển period (nút chip dạng pill) |

Tin nhắn empty theo period:

| Period | Thông báo |
|--------|----------|
| daily | "No artworks ranked in the last 24 hours" |
| weekly | "No artworks ranked in the last 7 days" |
| monthly | "No artworks ranked in the last 30 days" |
| rookie | "No artworks from rookie creators yet" |

## Dữ liệu được tải

| API endpoint | Dữ liệu | Phân trang |
|--------------|---------|------------|
| `/api/artworks` (feed store) | Rankings theo period + type | Load More (server-side pagination) |

Tham số request: `period`, `type` (optional), `page`.

## Tương tác

| Tác vụ | Hành vi |
|--------|---------|
| **Chuyển tab type** | Cập nhật URL query, tải lại danh sách |
| **Chuyển period** | Cập nhật URL query, tải lại danh sách |
| **Click thumbnail / title** | Điều hướng đến `/artworks/:id` |
| **Click author** | Điều hướng đến `/users/:id/profile` |
| **Like** | Optimistic toggle — cập nhật UI ngay, gọi API, rollback nếu lỗi. Yêu cầu đăng nhập (redirect `/login?redirect=/rankings` nếu chưa auth) |
| **Bookmark** | Optimistic toggle — tương tự Like |
| **Load More** | Tải trang tiếp theo, append vào danh sách hiện tại |

## Trạng thái rỗng theo route

Query params được sync với URL. Khi thay đổi bộ lọc, URL cập nhật ngay (`router.replace`). Khi mount hoặc query thay đổi, normalize giá trị và tải lại dữ liệu.

## Responsive

| Kích thước | Hành vi |
|------------|---------|
| ≥ 768px | Padding hai bên 72px, max-width 1200px |
| < 768px | Padding hai bên thu hẹp xuống 16px |

## Ghi chú

- Like/Bookmark sử dụng optimistic update — UI cập nhật trước khi API trả về.
-乐观更新 có rollback nếu API call thất bại.
- Count hiển thị dạng rút gọn: ≥10k → `x.xw`, ≥1k → `x.xk`.
