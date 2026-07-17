# Trang Cài đặt (SettingsView)

## Tổng quan

`SettingsView` là trang cài đặt tài khoản cho người dùng — quản lý thông tin cá nhân, ngôn ngữ, hiển thị và quyền riêng tư. Trang này sử dụng `MainLayoutTemplate` với sidebar điều hướng dọc và vùng nội dung động.

Hình 1: Giao diện trang Cài đặt với sidebar tab.

## Route

| Route      | Yêu cầu   | Mô tả                        |
| ---------- | --------- | ---------------------------- |
| `/settings` | Đăng nhập | Trang cài đặt tài khoản       |
| `/setting`  | —         | Redirect đến `/settings`      |

## Cấu trúc trang

### 1. Settings Sidebar

- Sidebar dọc bên trái (`<nav class="settings-sidebar">`) với 4 mục tab:
  - **Account** (Tài khoản) — icon `fa-user`
  - **Language and location** (Ngôn ngữ và vị trí) — icon `fa-globe`
  - **Display settings** (Cài đặt hiển thị) — icon `fa-eye`
  - **Privacy** (Quyền riêng tư) — icon `fa-lock`
- Tab đang active được highlight.
- Sidebar hỗ trợ thu gọn (`sidebar-collapsed` class).

### 2. Tab Account

- **"Manage IlluWrl account" card**: Liên kết đến `/account` để quản lý thông tin chi tiết.
- **Info rows**: Hiển thị Nickname và Email (dạng text).
- **Change Password form**:
  - Current Password (input password)
  - New Password (input password)
  - Confirm New Password (input password)
  - Nút "Change Password" submit.

### 3. Tab Language and Location

- **Language selector**: Dropdown chọn ngôn ngữ với 3 lựa chọn:
  - English (en)
  - 日本語 (ja)
  - Tiếng Việt (vi)
- Nút "Save" để lưu lựa chọn ngôn ngữ.
- **Country/Region**: Hiển thị "Viet Nam" (dạng text cố định).

### 4. Tab Display Settings

- **Toggle switches** (Bootstrap form-check form-switch):
  - **Explicit content (R-18)**: Hiển thị nội dung người lớn.
  - **AI-generated work**: Hiển thị tác phẩm do AI tạo.
- **Blocklist button**: Nút "Configure" mở modal quản lý blocklist (nếu có).

### 5. Tab Privacy

- **Blocked users list**: Danh sách user đã chặn tải từ API.
  - Mỗi user hiển thị: Avatar + Display Name.
  - Nút toggle để bỏ chặn (unblock).
- **"Include works in collections" toggle**: Cho phép tác phẩm xuất hiện trong bộ sưu tập của người khác.

## Dữ liệu được tải

| API endpoint | Dữ liệu               | Ghi chú            |
| ------------ | --------------------- | ------------------ |
| `GET /api/users/blocked` | Danh sách user đã chặn | Tab Privacy       |
| `PUT /api/users/language` | Cập nhật ngôn ngữ      | Tab Language      |
| `PUT /api/users/password` | Đổi mật khẩu           | Tab Account       |
| `PUT /api/users/settings` | Cập nhật settings      | Tab Display/Privacy |

## Trạng thái

| Trạng thái  | Hiển thị            |
| ----------- | ------------------- |
| **Loading** | Spinner trên tab    |
| **Error**   | Toast thông báo lỗi |
| **Success** | Toast xác nhận      |

## Tương tác

- **Click sidebar tab** → Chuyển nội dung vùng phải.
- **Click "Change Password"** → Gọi API đổi mật khẩu + toast thành công/lỗi.
- **Click "Save" (Language)** → Gọi API cập nhật ngôn ngữ + reload i18n.
- **Toggle switch** → Gọi API cập nhật cài đặt real-time.
- **Click "Configure" (Blocklist)** → Mở modal blocklist (tuỳ chọn).

## Ghi chú

- Trang sử dụng `vue-i18n` để đa ngôn ngữ.
- Sidebar settings sử dụng `sidebar-collapsed` class đồng bộ với MainLayoutTemplate.
- Password validation được xử lý phía client trước khi gửi API.
