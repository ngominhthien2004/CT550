# Trang Đăng nhập (LoginView) và Đăng ký (SignUpView)

## 1. LoginView — Trang Đăng nhập

### Tổng quan

`LoginView` là form đăng nhập với background showcase image, hỗ trợ email/password và social login (Google, Facebook).

Hình 1: Giao diện trang Đăng nhập.

### Route

| Route | Mô tả |
|-------|-------|
| `/login` | Đăng nhập (standalone, không dùng MainLayoutTemplate) |
| `/login?redirect=/path` | Đăng nhập rồi redirect về path |
| `/login?reason=suspended` | Hiển thị thông báo tài khoản bị khoá |

### Cấu trúc

#### Background

- `AppSearchBar` variant "showcase" với `background-only` — hiển thị ảnh showcase làm nền.
- Overlay tối (`auth-overlay`) chồng lên nền.

#### Auth Card

- Bo tròn, nền surface, shadow.
- Brand logo: "IlluWrl" link về trang chủ.
- Title: "Welcome Back" (i18n).

#### Social Login

| Nút | Icon | Action |
|-----|------|--------|
| Google | `fa-brands fa-google` | Redirect `/api/auth/google` |
| Facebook | `fa-brands fa-facebook` | Redirect `/api/auth/facebook` |

#### Email Form

| Field | Type | Placeholder |
|-------|------|-------------|
| Email | email | "Enter your email" |
| Password | password | "Enter your password" |

- Nút "Log In" (btn-primary).
- Disabled + spinner khi đang login.

#### Error Handling

- Empty fields → "Please fill in all fields"
- Login failed → thông báo từ `authStore.error`
- Suspended account → warning badge với icon `fa-triangle-exclamation`

#### Footer

- "New here? Create an account" → link `/signup`.

### Tương tác

- **Submit form** → `authStore.login()` → redirect (query.redirect hoặc `/`)
- **Social login** → redirect OAuth provider
- **Suspended** → hiển thị warning message

### Ghi chú

- Form fields validate client-side trước khi gọi API.
- Redirect path taken từ `route.query.redirect` (default: `/`).
- Styles imported từ `assets/styles/auth.css`.

---

## 2. SignUpView — Trang Đăng ký

### Tổng quan

`SignUpView` là form đăng ký mới — hỗ trợ email/password và social login. Form email mặc định ẩn, cần toggle để hiển thị.

Hình 2: Giao diện trang Đăng ký.

### Route

| Route | Mô tả |
|-------|-------|
| `/signup` | Đăng ký tài khoản (standalone) |

### Cấu trúc

#### Background

- Tương tự LoginView: showcase background + overlay.

#### Social Registration (mặc định hiển thị)

| Nút | Icon | Action |
|-----|------|--------|
| "Continue with Google" | `fa-brands fa-google` | Redirect `/api/auth/google` |
| "Continue with Facebook" | `fa-brands fa-facebook` | Redirect `/api/auth/facebook` |

#### Email Form Toggle

- Nút "Sign up with email" / "Hide email form" — toggle hiển thị form.

#### Email Form (khi mở)

| Field | Type | Placeholder |
|-------|------|-------------|
| Username | text | "Choose a username" |
| Email | email | "Enter your email" |
| Password | password | "Min 6 characters" |
| Confirm Password | password | "Confirm your password" |

- Validation: password phải khớp confirm password.
- Nút "Register" (btn-primary).

#### Footer

- "Already have an account? Log in" → link `/login`.
- "By signing up, you agree to our Terms of Service and Privacy Policy."

### Tương tác

- **Submit form** → `authStore.register()` → redirect `/`
- **Social registration** → redirect OAuth provider
- **Toggle form** → hiện/ẩn email form

### Ghi chú

- Social buttons displayed first (above the email toggle) — reduce friction for OAuth users.
- Email form collapsed by default — cleaner initial view.
- Password minimum 6 characters (validated backend).
- Styles shared with LoginView via `assets/styles/auth.css`.
