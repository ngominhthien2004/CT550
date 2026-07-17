# Trang Chỉnh sửa Tác phẩm (EditArtworkView)

## Tổng quan

`EditArtworkView` là trang chỉnh sửa thông tin tác phẩm đã đăng — cho phép người dùng cập nhật tiêu đề, mô tả, tag, age rating và cài đặt comment. Trang này sử dụng `MainLayoutTemplate` với hero banner gradient và form chỉnh sửa.

Hình 1: Giao diện trang Chỉnh sửa tác phẩm với hero banner và form.

## Route

| Route              | Yêu cầu   | Mô tả                          |
| ------------------ | --------- | ------------------------------ |
| `/artworks/:id/edit` | Đăng nhập | Chỉnh sửa tác phẩm có ID `:id` |

## Cấu trúc trang

### 1. Hero Banner

- Banner gradient từ `#0096fa` (xanh dương) đến `#7c3aed` (tím), bo tròn 16px.
- Hiển thị:
  - **Title**: Tiêu đề tác phẩm (hiện tại).
  - **Type pill**: Badge thể loại (Illust, Manga, GIF, Novel).
  - **Image count**: Số lượng ảnh (nếu có nhiều ảnh).
  - **View count**: Số lượt xem.
  - **"View artwork" link**: Liên kết quay lại trang chi tiết tác phẩm.

### 2. Preview Strip

- Thanh ngang hiển thị tối đa 5 thumbnail ảnh.
- Scroll ngang nếu có nhiều hơn 5 ảnh.
- `+N` badge cho số ảnh còn lại.

### 3. Edit Form

Form chỉnh sửa (`<form class="edit-form">`) gồm các thẻ card:

#### Settings Card
- **Type of work**: Badge thể loại (read-only, không thể thay đổi).
- **Age rating**: Radio button — All ages / R-18.
- **Comments**: Radio button — On / Off.

#### Form Card
- **Title input**: Text input với character counter (max 200 ký tự).
- **Description textarea**: Textarea với character counter (max 5000 ký tự).

#### Tags
- **UploadTagSelector component**: Input tag với autocomplete suggestions.
- Thêm/xoá tag tự động.

#### Age Rating Card (xuất hiện lần thứ hai trong template — duplicate)
- Radio button Age rating xuất hiện lại ở cuối form.

#### Form Actions
- **Delete button**: Nút đỏ "Delete artwork" — mở confirmation modal.
- **Save button**: Nút "Save changes" — lưu thay đổi.

### 4. Delete Confirmation Modal

- Backdrop overlay.
- Nội dung: "Are you sure you want to delete this artwork?".
- Hai nút: "Cancel" / "Delete".

## Dữ liệu được tải

| API endpoint | Dữ liệu                          |
| ------------ | -------------------------------- |
| `getArtworkById(id)` | Thông tin tác phẩm hiện tại |
| `getTags(query)`     | Gợi ý tag cho autocomplete  |

## Trạng thái

| Trạng thái  | Hiển thị                        |
| ----------- | ------------------------------- |
| **Loading** | Spinner "Loading artwork data..." |
| **Error**   | Alert "Failed to load artwork"  |
| **Saving**  | Save button disabled + spinner  |
| **Success** | Toast "Changes saved" + redirect |

## Tương tác

- **Click "View artwork"** → Điều hướng đến `/artworks/:id`.
- **Click "Save changes"** → Validate form → Gọi API update → Toast thành công.
- **Click "Delete artwork"** → Mở modal xác nhận → Gọi API delete → Redirect.
- **Nhập tag** → Autocomplete gợi ý từ API tags.
- **Chọn Age Rating** → Radio button thay đổi giá trị.

## Ghi chú

- Không thể thay đổi thể loại (type) tác phẩm sau khi đã đăng.
- Character counter hiển thị số ký tự đã nhập / giới hạn.
- Ảnh tác phẩm không thể thay đổi qua trang này — chỉ có thể xoá và tải lên lại.
- Có duplicate Age Rating card trong template — cần kiểm tra logic.
