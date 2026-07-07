# Các Trang (Pages)

## Tổng quan

Phần này mô tả chi tiết từng trang trong hệ thống IlluWrl. Mỗi trang là một view component trong Vue Router, có thể sử dụng `MainLayoutTemplate` hoặc là standalone page.

## Danh sách trang

| Route | Tên View | Mô tả | Bố cục |
|-------|----------|-------|--------|
| `/` | HomePage | Trang chủ với banner, đề xuất và feed cá nhân hoá | MainLayout |
| `/illustrations` | ArtworkListPage | Danh sách illustration với bộ lọc | MainLayout |
| `/manga` | ArtworkListPage | Danh sách manga | MainLayout |
| `/gifs` | ArtworkListPage | Danh sách GIF động | MainLayout |
| `/novels` | NovelListPage | Danh sách tiểu thuyết | MainLayout |
| `/search` | SearchResultsView | Kết quả tìm kiếm tác phẩm | MainLayout |
| `/search/users` | SearchUsersView | Kết quả tìm kiếm người dùng | MainLayout |
| `/discovery` | DiscoveryView | Khám phá tác phẩm ngẫu nhiên | MainLayout |
| `/rankings` | RankingsView | Bảng xếp hạng | MainLayout |
| `/artworks/:id` | ArtworkDetailView | Chi tiết tác phẩm (illust/manga/GIF) | MainLayout |
| `/novels/:id` | NovelDetailView | Chi tiết tiểu thuyết | MainLayout |
| `/series/:id` | SeriesDetailView | Chi tiết bộ series | MainLayout |
| `/bookmarks` | BookmarksView | Tác phẩm đã đánh dấu (redirect → `/account?tab=bookmarks`) | MainLayout |
| `/favorites` | FavoritesView | Tác phẩm yêu thích | MainLayout |
| `/history` | BrowseHistoryView | Lịch sử xem | MainLayout |
| `/upload/:kind` | UploadArtworkView | Đăng tải tác phẩm mới | MainLayout |
| `/dashboard` | DashboardView | Bảng tổng quan người dùng | MainLayout |
| `/requests/manage` | RequestManageView | Quản lý yêu cầu commission | MainLayout |
| `/messages` | MessagesView | Tin nhắn | MainLayout |
| `/notifications` | NotificationsView | Thông báo | MainLayout |
| `/account` | AccountSettingsView | Cài đặt tài khoản | MainLayout |
| `/chat` | ChatView | Chat với AI | Standalone |
| `/draw` | DrawingView | Công cụ vẽ tranh | Standalone |
| `/ai` | AIView | Các tính năng AI | Standalone |
| `/admin` | AdminView | Quản trị hệ thống | MainLayout |
| `/plans` | PlansView | Gói dịch vụ | MainLayout |
| `/login` | LoginView | Đăng nhập | Standalone |
| `/signup` | SignUpView | Đăng ký tài khoản | Standalone |
| `/following` | FollowingView | Tác phẩm từ người đang theo dõi | MainLayout |
| `/auth/callback` | AuthCallbackView | Xác thực OAuth | Standalone |

## Trang standalone

Các standalone pages không sử dụng `MainLayoutTemplate`:

- **LoginView** (`/login`): Biểu mẫu đăng nhập, không có sidebar hay topbar.
- **SignUpView** (`/signup`): Biểu mẫu đăng ký.
- **FeedView** (`/feed`): Trang feed thuần (trước đây là standalone, nay có thể dùng layout).
- **DrawingView** (`/draw`): Công cụ vẽ với Konva.js, toàn màn hình.
- **AIView** (`/ai`): Trang tính năng AI.
- **AuthCallbackView** (`/auth/callback`): Xử lý callback OAuth (Google).

Hình 1: Sơ đồ các route chính trong hệ thống IlluWrl.
