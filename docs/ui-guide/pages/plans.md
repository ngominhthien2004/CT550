# Trang Gói dịch vụ / Plans (PlansTopPageView)

## Tổng quan

`PlansTopPageView` hiển thị các gói commission đang mở — cho phép người dùng khám phá creator và plan commission. Trang sử dụng `MainLayoutTemplate` với HomeTabs và nhiều section hiển thị plan.

Hình 1: Giao diện trang Plans với hero, creators strip, và grids plan.

## Route

| Route | Mô tả |
|-------|-------|
| `/plans` | Danh sách plan commission |

## Cấu trúc trang

### 1. HomeTabs

- Component tabs chung với trang chủ (Home tab navigation).

### 2. PlansHero — Banner giới thiệu

- Component `PlansHero`: hiển thị số lượng plan và creator đang mở.
- Props: `planCount`, `creatorCount`.

### 3. CreatorsStrip — Dải creator

- Component `CreatorsStrip`: hiển thị danh sách creator có plan.
- Mỗi creator: avatar, tên, số plan.
- Nút Follow/Unfollow (AJAX toggle).
- Yêu cầu đăng nhập để follow.

### 4. Top Plans by Price

- Section "Top plans by price".
- Grid `PlanCard` sắp xếp theo `targetPrice` DESC, lấy top 6.
- Hiển thị: accepting status + available slots.

### 5. Newest Plans

- Section "Newest plans".
- Grid `PlanCard` sắp xếp theo `createdAt` DESC, lấy top 12.
- Hiển thị: meta info (loại work, giá, thời gian).

### 6. Plans by Work Type

- Section "Plans accepting {type}" cho mỗi loại work.
- Grid `PlanCard` (tối đa 6 plan mỗi type).
- Highlight type tag.

## Dữ liệu được tải

| API endpoint | Dữ liệu |
|--------------|---------|
| `requestApi.getTerms({ openOnly: 'true' })` | Tất cả plan đang mở |
| `followStore.fetchFollowStatus(creatorId)` | Trạng thái follow (per creator) |

## Trạng thái

| Trạng thái | Hiển thị |
|------------|----------|
| **Loading** | "Loading plans..." |
| **Error** | Thông báo lỗi (danger color) |
| **Empty** | "No open commission plans at the moment. Check back later." |

## Responsive

| Kích thước | Hành vi |
|------------|---------|
| ≥ 640px | Grid auto-fill, minmax(300px, 1fr) |
| < 640px | Grid 1 cột |

## Tương tác

- **Click creator** → profile creator
- **Follow/Unfollow** → AJAX toggle (yêu cầu login)
- **Click plan** → chi tiết plan / profile creator tab requests
- **Tab switching** → HomeTabs navigation

## Ghi chú

- PlanCard component reusable với boolean props: `showAccepting`, `showSlots`, `showMeta`, `highlightType`.
- Creator map built from plans data — group by creator ID, count plans per creator.
- Plan link to creator's profile requests tab: `/account?user=<id>&tab=requests`.
- Follow toggle use `followStore.toggleFollowByUser(userId)`.
- Unauthenticated follow attempt redirects to `/login?redirect=/plans`.
