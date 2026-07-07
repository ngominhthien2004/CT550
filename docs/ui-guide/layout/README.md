# Bố cục Hệ thống (Layout)

## Tổng quan

Hệ thống bố cục của IlluWrl được thiết kế theo kiến trúc **hai tầng** (two-tier layout). Tầng cao nhất là `App.vue` — nơi chứa router-view chính. Các trang được chia làm hai loại:

| Loại | Mô tả | Ví dụ |
|------|-------|-------|
| **Standalone Pages** | Trang độc lập, không dùng MainLayoutTemplate | `LoginView`, `SignUpView`, `FeedView`, `DrawingView`, `AIView`, `AuthCallbackView` |
| **Layout Pages** | Trang sử dụng MainLayoutTemplate làm khung | Hầu hết các trang còn lại |

## Cấu trúc MainLayoutTemplate

```
App.vue
└── router-view
    ├── Standalone pages (không bọc MainLayout)
    └── MainLayoutTemplate
        ├── sidebar-backdrop (lớp phủ khi sidebar overlay)
        ├── AppSidebarMenu (thanh bên trái)
        └── main-pane
            ├── AppTopBar (thanh trên cùng)
            └── main-content <slot /> (nội dung trang)
```

## Bố trí không gian

```
┌─────────────────────────────────────────────────┐
│  AppTopBar (top-nav)                             │
├──────────┬──────────────────────────────────────┤
│          │                                       │
│  Sidebar │   main-content (slot)                 │
│  (250px) │                                       │
│          │                                       │
└──────────┴──────────────────────────────────────┘

Footer (nếu có) — nằm trong nội dung từng trang
```

## Các thành phần nổi (FAB)

Hai nút nổi được teleport ra ngoài MainLayoutTemplate:

1. **Back-to-top**: Nút cuộn lên đầu trang, góc dưới bên phải.
2. **AI Chat FAB**: Nút mở chat AI, góc dưới bên phải (lệch so với back-to-top).

## Breakpoints Responsive

| Kích thước | Hành vi |
|------------|---------|
| ≥ 1200px | Bố cục đầy đủ, sidebar hiển thị cạnh nội dung |
| 920px – 1199px | Margin nhỏ hơn, sidebar vẫn ở chế độ cố định |
| < 920px | Sidebar chuyển sang chế độ overlay (lớp phủ), không chiếm margin-left |

## CSS Classes quan trọng

- `.sidebar-compact-active`: Kích hoạt chế độ sidebar thu gọn (chỉ icon).
- `.sidebar-hidden`: Ẩn hoàn toàn sidebar, dùng trên thiết bị di động.

Hình 1: Sơ đồ bố cục hệ thống IlluWrl.
