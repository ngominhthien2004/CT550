# Trang Công cụ Vẽ (DrawingView)

## Tổng quan

`DrawingView` là ứng dụng vẽ tranh tích hợp trong IlluWrl, sử dụng Konva.js qua vue-konva. Trang là **standalone page** — không sử dụng `MainLayoutTemplate`, chiếm toàn bộ màn hình.

Hình 1: Giao diện trang Drawing Tool với canvas, tool panel và layers panel.

## Route

| Route | Loại | Mô tả |
|-------|------|-------|
| `/draw` | Standalone | Công cụ vẽ tranh (toàn màn hình) |

## Cấu trúc trang

### Bố cục tổng thể

```
┌─────────────────────────────────────────┐
│              DrawingTopBar              │
├──────────┬──────────────┬───────────────┤
│ Drawing  │ DrawingCanvas│ DrawingLayers │
│ ToolPanel│   (Konva)    │    Panel      │
└──────────┴──────────────┴───────────────┘
```

- **Nền**: Dark theme (`#1a1a1e`).
- **Chiều cao**: `100vh` (full viewport).
- **User-select**: None (tránh highlight khi vẽ).

### 1. DrawingTopBar

Thanh công cụ trên cùng với các nút chức năng: lưu, tải, xuất, undo/redo, v.v.

### 2. DrawingToolPanel

Bảng chọn công cụ bên trái: brush, eraser, shapes, text, v.v.

### 3. DrawingCanvas

Canvas Konva.js ở trung tâm:
- Hỗ trợ vẽ tự do, hình dạng, text.
- Zoom và pan.
- Kích thước tự động theo viewport.

### 4. DrawingLayersPanel

Bảng quản lý layers bên phải:
- Danh sách layers.
- Ẩn/hiện, khoá layer.
- Thay đổi thứ tự layer.

### 5. Modals

| Modal | Mô tả |
|-------|-------|
| **SaveSlotsModal** | Lưu tác phẩm vào các slot |
| **PostDrawingModal** | Đăng tải vẽ lên nền tảng |

### 6. File Import

- Input file ẩn (accept: PNG, JPEG, WEBP, GIF).
- Import ảnh vào canvas.

## Tính năng

| Tính năng | Mô tả |
|-----------|-------|
| **Autosave** | Tự động lưu vào localStorage |
| **Restore** | Khôi phục bản autosave khi mở lại |
| **Keyboard shortcuts** | Phím tắt cho undo/redo, tools |
| **Resize handling** | Tự động fit canvas khi resize window |
| **Route leave guard** | Cảnh báo khi chưa lưu khi rời trang |
| **Context menu disable** | Chặn menu chuột phải |

## Lifecycle

| Sự kiện | Hành vi |
|---------|---------|
| **Mount** | Listen resize/keydown/keyup, fitToScreen, restoreAutosave |
| **Unmount** | Remove listeners, clearTimers |
| **Route leave** | Confirm nếu có nội dung chưa lưu |

## Ghi chú

- Component uses `useDrawingStore` (Pinia) quản lý toàn bộ state.
- Canvas sử dụng Konva.js — cần đảm bảo `vue-kanva` đã registered trong `main.js` (xem quirk #7 trong AGENTS.md).
- `onBeforeRouteLeave` guard chặn navigation nếu có nội dung chưa lưu.
- Background dark (`#1a1a1e`), text light (`#e0e0e0`).
