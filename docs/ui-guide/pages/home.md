# Trang Chủ (HomePage)

## Tổng quan

`HomePage` là trang đầu tiên người dùng nhìn thấy khi truy cập IlluWrl. Trang sử dụng `MainLayoutTemplate` và hiển thị nhiều phần nội dung khác nhau để giới thiệu tác phẩm nổi bật và đề xuất cá nhân hoá.

Hình 1: Giao diện trang chủ IlluWrl với đầy đủ các section.

## Cấu trúc trang

### 1. HomeTabs — Thanh tab điều hướng

Tab điều hướng cho phép người dùng chuyển đổi giữa các chế độ xem nội dung khác nhau trên trang chủ.

### 2. HomeTagStrip — Gợi ý tag phổ biến

- Dải tag ngang hiển thị các tag thịnh hành.
- Dữ liệu được lấy từ API tag phổ biến (giới hạn 12 tag).
- Click vào tag → điều hướng đến `/search?tag=ten-tag`.
- Tự động làm mới sau khoảng thời gian nhất định.

### 3. HomeHeroBanner — Banner nổi bật

- Banner quảng cáo/tuyên truyền tác phẩm nổi bật.
- Dữ liệu lấy từ API banner (do admin quản lý).
- Hỗ trợ nhiều banner, có thể chuyển đổi tự động (carousel).
- Mỗi banner có thể chứa hình ảnh, tiêu đề và liên kết đến tác phẩm.

### 4. HomeArtworkGrid — Lưới tác phẩm nổi bật (Spotlight)

- Hiển thị 12 tác phẩm spotlight đầu tiên.
- Chỉ hiển thị tác phẩm **không phải novel** (illustration, manga, GIF).
- Sử dụng component `ArtworkCard` để hiển thị từng tác phẩm.
- Bố trí dạng lưới (grid) responsive.

### 5. HomeFeedLayout — Bố cục Feed chính

Khu vực này gồm hai cột:

#### Cột trái: HomeFeedColumn

- **Khách (chưa đăng nhập)**: Hiển thị các tác phẩm mới nhất (latest artworks) — giới hạn 48 tác phẩm.
- **Người dùng đã đăng nhập**: Hiển thị feed cá nhân hoá **"Dành cho bạn" (For You)** — lấy từ `/feed/for-you`, dựa trên sở thích và lịch sử tương tác.
- Mỗi tác phẩm hiển thị dưới dạng thẻ với hình ảnh, tiêu đề, tác giả và thống kê tương tác.

#### Cột phải: HomeRecommendedUsers

- Danh sách người dùng đề xuất — top creators có nhiều tác phẩm nhất.
- Mỗi thẻ hiển thị: avatar, tên người dùng, số lượng tác phẩm.
- Nút **Follow/Unfollow** để theo dõi/ngừng theo dõi trực tiếp.

## Dữ liệu được tải

| API endpoint | Dữ liệu | Số lượng |
|--------------|---------|----------|
| `/api/artworks` | Tác phẩm mới nhất (không bao gồm novel) | 48 |
| `/api/tags/popular` | Tag phổ biến | 12 |
| `/api/banners` | Banner quảng cáo | Không giới hạn |
| `/feed/for-you` | Đề xuất cá nhân hoá (authenticated) | Theo cấu hình |

## Responsive

| Kích thước | Hành vi |
|------------|---------|
| ≥ 1200px | Layout hai cột đầy đủ |
| 920px – 1199px | Cột phải (recommended users) thu hẹp |
| < 920px | Cột phải ẩn, feed chiếm toàn bộ chiều rộng |

## Tương tác

- **Click vào thẻ tác phẩm**: Điều hướng đến trang chi tiết tác phẩm (`/artworks/:id`).
- **Click vào tag**: Điều hướng đến trang tìm kiếm với tag tương ứng.
- **Click Follow**: Theo dõi người dùng trực tiếp (AJAX, không tải lại trang).

Hình 2: Trang chủ ở chế độ tối (dark mode).
