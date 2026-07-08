# Trang Đang theo dõi (FollowingNewestView)

## Tổng quan

`FollowingNewestView` hiển thị feed tác phẩm từ các người dùng mà user đang theo dõi. Trang sử dụng `MainLayoutTemplate` và tái sử dụng các component home page: `HomeTabs`, `HomeTagStrip`, `HomeArtworkGrid`, `HomeFeedColumn`.

Hình 1: Giao diện trang Following với spotlight grid và feed.

## Route

| Route | Mô tả |
|-------|-------|
| `/following` | Tác phẩm từ người đang theo dõi |

## Cấu trúc trang

### 1. HomeTabs

Tab điều hướng: Home, Following, Plans.

### 2. HomeTagStrip

Dải tag ngang hiển thị tag phổ biến (tối đa 12 tag).

### 3. HomeArtworkGrid — Spotlight

- Hiển thị 12 tác phẩm đầu tiên dạng grid.
- Component `ArtworkCard`.

### 4. HomeFeedColumn — Feed chính

- Hiển thị các tác phẩm còn lại (sau 12 spotlight).
- Dạng feed vertical.

### 5. Trạng thái

| Trạng thái | Hiển thị |
|------------|----------|
| **Loading** | "Loading artworks from followed users..." |
| **Error** | Thông báo lỗi |
| **Empty** | "No artworks from followed users. Follow more artists to see their works here!" |

## Dữ liệu được tải

| API endpoint | Dữ liệu | Giới hạn |
|--------------|---------|----------|
| `/api/feed` | Feed từ người theo dõi | 48 tác phẩm |
| `/api/tags` | Tag phổ biến | 12 tag |

## Responsive

| Kích thước | Hành vi |
|------------|---------|
| Desktop | Layout grid + feed đầy đủ |
| Mobile | Stack dọc |

## Ghi chú

- Trang này tái sử dụng hoàn toàn component từ HomePage.
- Spotlight works: slice 0-12 từ feed results.
- Feed works: slice 12+ từ feed results.
- Image field normalized: `item.images?.[0] || ''`.
