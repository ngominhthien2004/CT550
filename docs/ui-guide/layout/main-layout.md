# Bố cục Chính (MainLayoutTemplate)

## Tổng quan

`MainLayoutTemplate.vue` là component bố cục chính của IlluWrl, cung cấp khung cơ bản cho hầu hết các trang trong hệ thống. Nó quản lý thanh bên (sidebar), thanh trên cùng (topbar) và vùng nội dung chính.

Hình 1: Cấu trúc MainLayoutTemplate với các vùng được đánh dấu.

## Props

| Prop | Kiểu | Mặc định | Mô tả |
|------|------|----------|-------|
| `siteName` | String | `'IlluWrl'` | Tên hiển thị của trang web |
| `isNavCollapsed` | Boolean | `true` | Trạng thái sidebar (true = collapsed, false = expanded) |

## Cấu trúc DOM

```
.app-layout
├── .sidebar-backdrop (lớp phủ khi sidebar ở chế độ overlay)
├── AppSidebarMenu (thanh điều hướng bên trái)
└── .main-pane
    ├── AppTopBar (thanh điều hướng trên cùng)
    └── .main-content
        └── <slot /> (nội dung trang được render tại đây)
```

### Giải thích các vùng

| Vùng | Component/Khung | Mô tả |
|------|----------------|-------|
| **sidebar-backdrop** | Lớp phủ | Xuất hiện khi sidebar ở chế độ overlay (màn hình nhỏ), click vào backdrop để đóng sidebar |
| **AppSidebarMenu** | Component | Menu điều hướng bên trái, chứa các liên kết đến tất cả trang |
| **AppTopBar** | Component | Thanh trên cùng với tìm kiếm, thông báo và menu người dùng |
| **main-content** | Slot | Khu vực chính — nội dung trang được render vào đây |

## FABs được Teleport

Hai nút nổi được teleport từ component con lên cấp cao hơn:

1. **Back-to-top FAB**: Nút cuộn lên đầu trang, đặt ở góc dưới bên phải.
2. **AI Chat FAB**: Nút mở chat AI, đặt ở góc dưới bên phải (offset phía trên back-to-top).

## Hành vi Responsive

### Breakpoint ≥ 1200px

- Bố cục đầy đủ, sidebar hiển thị cạnh nội dung.
- Khoảng cách margin-left của main-pane: 240px (chiều rộng sidebar).

### Breakpoint 920px – 1199px

- Chỉ thay đổi `padding-inline` của `.main-pane` và `margin` của `.main-content` thành `0 40px`. Margin-left của main-pane vẫn giữ nguyên.
- Sidebar vẫn ở chế độ cố định (fixed) bên trái.

### Breakpoint < 920px

- Sidebar chuyển sang **chế độ overlay** — nổi phía trên nội dung.
- Lớp phủ (backdrop) màu đen với độ trong suốt 50% xuất hiện phía sau.
- Nội dung chính chiếm toàn bộ chiều rộng màn hình (không có margin-left).
- Click vào backdrop hoặc nút toggle để đóng sidebar.

## CSS Classes

| Class | Mô tả |
|-------|-------|
| `.sidebar-compact-active` | Kích hoạt chế độ sidebar thu gọn — chỉ hiển thị icon, ẩn văn bản |
| `.sidebar-hidden` | Ẩn hoàn toàn sidebar khỏi viewport |
| `.left-nav.collapsed` | Sidebar ẩn khỏi viewport (transform: translateX(-100%)) |
| `.sidebar-backdrop` | Lớp phủ tối phía sau sidebar ở chế độ overlay |

## Hành vi Interaction

- **Toggle sidebar**: Nút hamburger ☰ trên AppTopBar hoặc nút toggle trong sidebar.
- **Resize**: Tự động phát hiện thay đổi kích thước màn hình và chuyển đổi chế độ.
- **Đóng sidebar**: Click vào backdrop hoặc nút toggle trên AppTopBar để đóng sidebar.

Hình 2: MainLayoutTemplate ở chế độ mobile với sidebar overlay đang mở.
