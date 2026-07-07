# Thành phần Dùng chung (Common Components)

## Tổng quan

Thư mục này mô tả các thành phần giao diện **dùng chung** (shared/reusable components) được sử dụng trên nhiều trang khác nhau trong hệ thống IlluWrl. Các component này có thể được import và tái sử dụng ở bất kỳ đâu trong ứng dụng.

## Danh sách component

| Component | Mô tả | Sử dụng tại |
|-----------|-------|-------------|
| **AppTopBarSearchControls** | Thanh tìm kiếm tích hợp trên topbar | AppTopBar, nhiều trang |
| **AppSearchBar** | Thanh tìm kiếm độc lập | Trang tìm kiếm |
| **AppSearchHistoryPanel** | Panel lịch sử tìm kiếm | Trang tìm kiếm |
| **SearchOptionsModal** | Modal tìm kiếm nâng cao | Trang tìm kiếm |
| **SearchFilterBar** | Thanh lọc kết quả tìm kiếm | Trang tìm kiếm, khám phá |
| **SearchResultHeader** | Header kết quả tìm kiếm | Trang tìm kiếm |
| **UserSearchFilters** | Bộ lọc tìm kiếm người dùng | `/search/users` |
| **ArtworkCard** | Thẻ hiển thị tác phẩm | Trang chủ, khám phá, tìm kiếm, favorites |
| **R18BlurOverlay** | Lớp phủ làm mờ nội dung R-18 | ArtworkCard, ArtworkDetailViewer |

## Nguyên tắc thiết kế

- **Tính tái sử dụng**: Các component được thiết kế để hoạt động độc lập với dữ liệu thông qua props.
- **Props-driven**: Dữ liệu đầu vào được truyền qua props, không phụ thuộc trực tiếp vào store.
- **Scoped CSS**: Style được giới hạn trong component (Vue scoped) để tránh xung đột.
- **Shared CSS**: Khi có style dùng chung, được trích xuất vào `src/assets/styles/` dạng file `.css` riêng.

## Hook và Store liên quan

- **`useSearchHistory`**: Composable quản lý lịch sử tìm kiếm (localStorage).
- **`useFavoriteTags`**: Composable quản lý tag yêu thích.
- Các store Pinia: bookmark, like, auth, tag.

Hình 1: Các common component được đánh dấu trong sơ đồ ứng dụng.
