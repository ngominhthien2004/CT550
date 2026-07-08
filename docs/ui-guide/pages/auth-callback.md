# Trang OAuth Callback (AuthCallbackView)

## Tổng quan

`AuthCallbackView` xử lý callback từ xác thực xã hội (Google, Facebook). Trang là **standalone page** — hiển thị spinner loading trong khi xử lý token và redirect.

Hình 1: Giao diện trang AuthCallback với spinner "Signing in...".

## Route

| Route | Mô tả |
|-------|-------|
| `/auth/callback` | Xác thực OAuth callback |

## Query Parameters

| Param | Mô tả |
|-------|-------|
| `token` | JWT token từ server |
| `_id` | User ID |
| `username` | Tên người dùng |
| `email` | Địa chỉ email |
| `role` | Vai trò (user/admin) |
| `redirect` | Đường dẫn redirect sau login |
| `error` | Mã lỗi (nếu xác thực thất bại) |

## Xử lý

### Thành công

1. Lấy `token`, `_id`, `username`, `email`, `role` từ query.
2. Gọi `authStore.setSession()` để lưu session.
3. Redirect đến `redirect` query param (mặc định `/`).

### Thất bại

1. Nếu thiếu `token` hoặc `_id` → redirect về `/login?error={errorMsg}`.
2. Error mặc định: `social_auth_failed`.

## Giao diện

- Nền: `min-height: 100vh`, flex center.
- Spinner: Bootstrap `spinner-border text-primary`.
- Text: "Signing in..." (text-muted).

## Ghi chú

- Trang chỉ render tạm thời — redirect xảy ra gần như ngay lập tức trong `onMounted`.
- Không có giao diện interactive.
- Endpoint OAuth: `/api/auth/google`, `/api/auth/facebook`.
