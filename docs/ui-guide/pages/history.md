# Trang Lịch sử Xem (BrowseHistoryView)

## Tổng quan

`BrowseHistoryView` hiển thị lịch sử xem tác phẩm của người dùng. Trang này yêu cầu xác thực — người dùng chưa đăng nhập sẽ được chuyển hướng đến trang đăng nhập.

Hình 1: Giao diện trang Lịch sử xem (BrowseHistoryView).

## Route

| Route | Yêu cầu | Mô tả |
|-------|---------|-------|
| `/history` | Bắt buộc đăng nhập | Xem lịch sử duyệt tác phẩm |

## Cấu trúc trang

### Header (Tiêu đề trang)

- **Tiêu đề**: "Lịch sử xem" với biểu tượng đồng hồ (`fa-clock`).
- **Tổng số**: Hiển thị tổng số mục trong lịch sử (ví dụ: "48 tác phẩm").
- **Nút Filter toggle**: Bật/tắt bảng lọc ngày.
- **Nút Clear all**: Xoá toàn bộ lịch sử (kèm xác nhận).

### Thanh tìm kiếm

- Ô nhập văn bản với biểu tượng kính lúp.
- **Debounce 350ms**: Tìm kiếm tự động sau khi ngừng gõ 350 mili giây.
- Tìm kiếm theo tiêu đề tác phẩm (title).

### Bảng lọc ngày (Date Filter Panel)

Có thể bật/tắt bằng nút Filter toggle:

| Thành phần | Mô tả |
|------------|-------|
| **Từ ngày (From)** | Input date, chọn ngày bắt đầu |
| **Đến ngày (To)** | Input date, chọn ngày kết thúc |
| **Nút Apply** | Áp dụng bộ lọc ngày |
| **Nút Clear** | Xoá bộ lọc ngày |

### Danh sách thẻ lịch sử (History Cards)

Mỗi thẻ hiển thị:

| Thông tin | Mô tả |
|-----------|-------|
| **Cover image** | Hình ảnh bìa tác phẩm, kích thước nhỏ |
| **Time badge** | Thời gian xem dạng tương đối (ví dụ: "2 giờ trước", "Hôm qua") |
| **Title** | Tiêu đề tác phẩm, liên kết đến trang chi tiết |
| **Author** | Avatar + tên tác giả, liên kết đến trang người dùng |
| **Stats** | Số lượt thích (♥), đánh dấu (🔖), lượt xem (👁) |

### Phân trang

- Phân trang với số trang hiển thị.
- Điều hướng: Trang trước / Trang sau.
- Số trang được nén với dấu "..." cho khoảng cách lớn.

## Trạng thái giao diện

| Trạng thái | Hiển thị |
|------------|----------|
| **Loading** | Skeleton cards với hiệu ứng pulse animation |
| **Error** | Biểu tượng lỗi + thông báo "Không thể tải lịch sử" |
| **Empty** | Biểu tượng đồng hồ + "Chưa có lịch sử xem" + liên kết "Khám phá tác phẩm" |

## Tương tác

- **Click vào thẻ**: Điều hướng đến `/artworks/:id` (hoặc `/novels/:id`).
- **Hover vào thẻ**: Hiệu ứng nổi (shadow) nhẹ.
- **Xoá lịch sử**: Nút "Clear all" hiển thị hộp thoại xác nhận trước khi xoá.
- **Lọc ngày**: Kết hợp với tìm kiếm từ khoá để lọc chính xác.

Hình 2: Date Filter Panel mở rộng với các input ngày.

## Ghi chú

- Lịch sử được tự động ghi lại khi người dùng xem chi tiết tác phẩm.
- Thời gian tương đối sử dụng thư viện moment hoặc hàm format tự động.
- Dữ liệu lịch sử được phân trang từ server, mỗi trang 20-30 mục.
