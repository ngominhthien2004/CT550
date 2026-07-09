# Trang Quản lý Yêu cầu Commission (RequestManageView)

## Tổng quan

`RequestManageView` là trang quản lý yêu cầu commission cho cả creator và client. Trang sử dụng `MainLayoutTemplate` và hiển thị danh sách requests, plans, chi tiết request, và chat trong request.

Hình 1: Giao diện trang Request Management với danh sách requests và chi tiết.

## Route

| Route              | Yêu cầu            | Mô tả                      |
| ------------------ | ------------------ | -------------------------- |
| `/requests/manage` | Bắt buộc đăng nhập | Quản lý yêu cầu commission |

## Cấu trúc trang

### Header

| Thành phần             | Mô tả                                             |
| ---------------------- | ------------------------------------------------- |
| **Title**              | "Request Management"                              |
| **Dashboard link**     | Nút "Dashboard" →`/dashboard`                     |
| **Profile plans link** | Nút "View profile plans" →`/account?tab=requests` |

### 1. RequestListSection — Danh sách requests

#### Role Switcher

Chuyển đổi giữa hai vai trò:

| Role        | Giá trị   | Mô tả                       |
| ----------- | --------- | --------------------------- |
| **Creator** | `creator` | Xem requests mình nhận được |
| **Client**  | `client`  | Xem requests mình đã gửi    |

#### Filters

| Filter            | Mô tả                         |
| ----------------- | ----------------------------- |
| **Status filter** | Lọc theo trạng thái request   |
| **Search**        | Tìm kiếm theo tiêu đề request |

#### Request List

Mỗi request hiển thị trong danh sách, click để xem chi tiết.

#### Actions

Các hành động trên request (tùy trạng thái): approve, reject, deliver, etc. — thực hiện qua `requestStore.transition()`.

### 2. PlansSection — Quản lý plans (chỉ Creator)

- Hiển thị khi role là `creator`.
- Danh sách commission plans đã tạo.
- Nút **"Create"** → mở `CreatePlanForm`.

### 3. CreatePlanForm — Form tạo plan mới

- Hiển thị khi role là `creator` và bấm nút Create.
- Form nhập thông tin plan mới.
- Nút Close để đóng.
- Sau khi lưu → reload toàn bộ data.

### 4. RequestDetailPanel — Chi tiết request

Hiển thị khi chọn một request:

| Thành phần           | Mô tả                                         |
| -------------------- | --------------------------------------------- |
| **Request info**     | Thông tin chi tiết request                    |
| **Chat**             | Khu vực chat trong request (creator ↔ client) |
| **Actions**          | Các nút hành động theo trạng thái             |
| **Draft submission** | Nộp bản nháp (submit draft)                   |

#### Chat trong request

- Gửi tin nhắn qua `requestStore.sendChat()`.
- Load tin nhắn qua `requestStore.getChat()`.
- Hiển thị trong `RequestDetailPanel`.

#### Draft Submission

- Creator gửi bản nháp qua `requestStore.submitDraft()`.
- Nhận `formData` (có thể包含 file).

## Dữ liệu được tải

| API endpoint                | Dữ liệu                     |
| --------------------------- | --------------------------- |
| `requestStore.fetchTerms()` | Plans của creator           |
| `requestStore.fetchMine()`  | Requests theo role + status |
| `requestStore.fetchById()`  | Chi tiết request            |
| `requestStore.getChat()`    | Tin nhắn chat trong request |

## Trạng thái

| Trạng thái  | Hiển thị                                |
| ----------- | --------------------------------------- |
| **Loading** | Spinner/loading state                   |
| **Error**   | `actionError` — thông báo lỗi từ action |
| **Empty**   | Không có request nào                    |

## Responsive

| Kích thước | Hành vi            |
| ---------- | ------------------ |
| Desktop    | Grid layout đầy đủ |
| Mobile     | Stacked layout     |

## Ghi chú

- Trang sử dụng `requestStore` (Pinia) quản lý toàn bộ state.
- `RequestDetailPanel` ref được dùng để update chat messages từ parent.
- Action errors hiển thị inline (không alert).
- Filter status và search query là local state, reload khi thay đổi role.
