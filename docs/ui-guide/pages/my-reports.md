# Trang Báo cáo của Tôi (MyReportsView)

## Tổng quan

`MyReportsView` hiển thị danh sách các báo cáo mà người dùng đã gửi — theo dõi trạng thái xử lý và kết quả từ admin. Trang này sử dụng `MainLayoutTemplate` với bảng dữ liệu dạng table và phân trang Bootstrap.

Hình 1: Giao diện trang My Reports với bảng danh sách báo cáo.

## Route

| Route       | Yêu cầu   | Mô tả                     |
| ----------- | --------- | ------------------------- |
| `/my-reports` | Đăng nhập | Xem lịch sử báo cáo của tôi |

## Cấu trúc trang

### 1. Header

- **Title**: "My Reports" với icon cờ (`fa-flag`).
- **Description**: Text mô tả ngắn về trang.
- **Refresh button**: Nút làm mới dữ liệu (`fa-sync-alt`).

### 2. Bảng Reports (Table)

Bảng dữ liệu (`<table class="table table-hover">`) với các cột:

| Cột         | Mô tả                                            |
| ----------- | ------------------------------------------------ |
| **Type**    | Badge thể loại (Artwork, User, Comment, etc.)    |
| **Target**  | Link đến nội dung bị báo cáo                     |
| **Reason**  | Lý do báo cáo (dạng text)                        |
| **Status**  | Badge trạng thái: Pending, Reviewed, Resolved, Rejected |
| **Date**    | Thời gian gửi báo cáo (dạng relative time)        |
| **Resolution Note** | Ghi chú từ admin (nếu có)                |

### 3. Phân trang

- Bootstrap pagination khi `totalPages > 1`.
- Điều hướng trang trước/sau, số trang.

### 4. Unauthenticated State

- Khi chưa đăng nhập: "You are not logged in" + nút "Login".

## Dữ liệu được tải

| API endpoint                | Dữ liệu                                |
| --------------------------- | -------------------------------------- |
| `GET /api/reports/my`       | Danh sách báo cáo của user (phân trang) |

## Trạng thái

| Trạng thái        | Hiển thị                            |
| ----------------- | ----------------------------------- |
| **Loading**       | Spinner `spinner-border`            |
| **Error**         | Thông báo lỗi                       |
| **Empty**         | Icon cờ + "No reports yet"          |
| **Not logged in** | "You are not logged in" + login btn |
| **Has data**      | Bảng reports + phân trang           |

## Tương tác

- **Click Refresh** → Tải lại danh sách báo cáo.
- **Click Target link** → Điều hướng đến nội dung bị báo cáo.
- **Click phân trang** → Chuyển trang.
- **Click "Login" (unauthenticated)** → Điều hướng `/login`.

## Ghi chú

- Component được lazy-load (`() => import(...)`) để giảm bundle size.
- Sử dụng Bootstrap 5 classes: `table`, `table-hover`, `pagination`, `badge`, `spinner-border`.
- Trạng thái báo cáo được map qua màu badge: Pending (warning), Reviewed (info), Resolved (success), Rejected (danger).
