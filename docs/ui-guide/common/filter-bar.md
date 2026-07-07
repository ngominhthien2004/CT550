# Thanh Lọc (Filter Bar)

## Tổng quan

IlluWrl sử dụng nhiều loại thanh lọc khác nhau để giúp người dùng thu hẹp kết quả tìm kiếm và duyệt tác phẩm theo các tiêu chí mong muốn.

---

## 1. SearchFilterBar

### Mô tả

Thanh lọc kết quả tìm kiếm chính, xuất hiện trên trang tìm kiếm và trang khám phá.

Hình 1: SearchFilterBar với các bộ lọc sort, age rating và novel-specific.

### Cấu trúc

| Bộ lọc | Loại | Giá trị | Mô tả |
|--------|------|---------|-------|
| **Sort (Sắp xếp)** | Select dropdown | Newest, Popular, Most Viewed | Thứ tự hiển thị |
| **Age rating (Độ tuổi)** | Pill buttons | Tất cả (All), An toàn (Safe), R-18 | Mức độ nội dung |
| **Word count (Số từ)** | Select dropdown | `< 1K`, `1K–5K`, `5K–10K`, `> 10K` | Chỉ hiển thị cho novel |

### Hành vi

- Thay đổi bộ lọc sẽ tự động cập nhật danh sách kết quả (gọi API lại).
- Các bộ lọc được đồng bộ với URL query parameters.
- Hỗ trợ lưu trạng thái lọc qua URL để chia sẻ đường dẫn.

---

## 2. SearchResultHeader

### Mô tả

Header hiển thị thông tin về kết quả tìm kiếm hiện tại, nằm phía trên danh sách kết quả.

### Cấu trúc

| Thành phần | Mô tả |
|------------|-------|
| **Keyword display** | Hiển thị từ khoá tìm kiếm hiện tại, có thể đóng (xoá) bằng nút X |
| **Tag suggestions** | Dải tag gợi ý liên quan đến từ khoá, click để thêm vào bộ lọc |
| **Favorite tag toggle** | Nút ♡/♥ để yêu thích tag hiện tại (lưu vào localStorage qua `useFavoriteTags`) |

---

## 3. UserSearchFilters

### Mô tả

Bộ lọc dành riêng cho tìm kiếm người dùng trên trang `/search/users`.

### Cấu trúc

| Bộ lọc | Loại | Giá trị |
|--------|------|---------|
| **Role (Vai trò)** | Select dropdown | Tất cả, Người dùng, Admin |
| **Sort mode (Sắp xếp)** | Select dropdown | Liên quan nhất, Mới nhất, Nhiều tác phẩm nhất |

---

## 4. Filter Bar trên các trang danh sách

Trên các trang danh sách như `/illustrations`, `/manga`, `/gifs`, trang có thể có các bộ lọc bổ sung:

| Trang | Bộ lọc |
|-------|--------|
| `/illustrations` | Sort, Age rating |
| `/manga` | Sort, Age rating, Số trang |
| `/gifs` | Sort, Age rating |
| `/novels` | Sort, Age rating, Số từ, Trạng thái |

## Props

Các component filter bar thường nhận các props sau:

| Prop | Kiểu | Mô tả |
|------|------|-------|
| `modelValue` | Object | Giá trị bộ lọc hiện tại (v-model) |
| `type` | String | Loại tác phẩm đang duyệt |
| `options` | Array | Các tuỳ chọn sẵn có |

## Events

| Event | Mô tả |
|-------|-------|
| `@update:modelValue` | Cập nhật giá trị bộ lọc |
| `@apply` | Áp dụng bộ lọc và tải lại kết quả |
| `@reset` | Đặt lại bộ lọc về mặc định |

Hình 2: UserSearchFilters với các dropdown role và sort mode.

## Ghi chú

- Các bộ lọc age rating và sort được chuẩn hoá để dùng chung qua nhiều trang.
- Khi kết hợp nhiều bộ lọc, query parameters trên URL được cập nhật để hỗ trợ chia sẻ đường dẫn tìm kiếm.
