# Các Trang (Pages)

## Tổng quan

Phần này mô tả chi tiết từng trang trong hệ thống IlluWrl. Mỗi trang là một view component trong Vue Router, có thể sử dụng `MainLayoutTemplate` hoặc là standalone page.

## Danh sách trang và tài liệu

| Route | Tên View | Bố cục | File mô tả |
|-------|----------|--------|------------|
| `/` | HomePage | MainLayout | [home.md](home.md) |
| `/illustrations` | ArtworkListPage | MainLayout | [upload.md](upload.md) |
| `/manga` | ArtworkListPage | MainLayout | [upload.md](upload.md) |
| `/gifs` | ArtworkListPage | MainLayout | [upload.md](upload.md) |
| `/novels` | NovelListPage | MainLayout | [upload.md](upload.md) |
| `/search` | SearchResultsView | MainLayout | [search.md](search.md) |
| `/search/users` | SearchUsersView | MainLayout | [search.md](search.md) |
| `/discovery` | DiscoveryView | MainLayout | [discovery.md](discovery.md) |
| `/rankings` | RankingsView | MainLayout | [rankings.md](rankings.md) |
| `/artworks/:id` | ArtworkDetailView | MainLayout | [artwork-detail.md](artwork-detail.md) |
| `/novels/:id` | NovelDetailView | MainLayout | [artwork-detail.md](artwork-detail.md) |
| `/series/:id` | SeriesDetailView | MainLayout | [series-detail.md](series-detail.md) |
| `/bookmarks` | BookmarksView | MainLayout | [bookmarks.md](bookmarks.md) |
| `/favorites` | FavoritesView | MainLayout | [bookmarks.md](bookmarks.md) |
| `/history` | BrowseHistoryView | MainLayout | [history.md](history.md) |
| `/upload/:kind` | UploadArtworkView | MainLayout | [upload.md](upload.md) |
| `/dashboard` | DashboardView | MainLayout | [dashboard.md](dashboard.md) |
| `/requests/manage` | RequestManageView | MainLayout | [request-manage.md](request-manage.md) |
| `/messages` | MessagesView | MainLayout | [messages.md](messages.md) |
| `/notifications` | NotificationsView | MainLayout | [notifications.md](notifications.md) |
| `/account` | AccountView | MainLayout | [account.md](account.md) |
| `/chat` | ChatView | MainLayout | [chat.md](chat.md) |
| `/draw` | DrawingView | Standalone | [drawing.md](drawing.md) |
| `/ai` | AIView | Standalone | [ai.md](ai.md) |
| `/admin` | AdminManagementView | MainLayout | [admin.md](admin.md) |
| `/plans` | PlansTopPageView | MainLayout | [plans.md](plans.md) |
| `/login` | LoginView | Standalone | [login-signup.md](login-signup.md) |
| `/signup` | SignUpView | Standalone | [login-signup.md](login-signup.md) |
| `/following` | FollowingNewestView | MainLayout | [following.md](following.md) |
| `/auth/callback` | AuthCallbackView | Standalone | [auth-callback.md](auth-callback.md) |
| `/settings` | SettingsView | MainLayout | [settings.md](settings.md) |
| `/artworks/:id/edit` | EditArtworkView | MainLayout | [edit-artwork.md](edit-artwork.md) |
| `/users/:id/following` | FollowUsersView | MainLayout | [follow-users.md](follow-users.md) |
| `/users/:id/followers` | FollowUsersView | MainLayout | [follow-users.md](follow-users.md) |
| `/my-reports` | MyReportsView | MainLayout | [my-reports.md](my-reports.md) |
| `/bookstore` | BookstoreHomeView | BookstoreLayout | [bookstore-ui-pages](../../book-store/ui-pages.md) |
| `/bookstore/:id` | BookDetailView | BookstoreLayout | [bookstore-ui-pages](../../book-store/ui-pages.md) |
| `/bookstore/upload` | BookUploadView | BookstoreLayout | [bookstore-ui-pages](../../book-store/ui-pages.md) |
| `/bookstore/manage` | BookManageView | BookstoreLayout | [bookstore-ui-pages](../../book-store/ui-pages.md) |
| `/bookstore/cart` | CartView | BookstoreLayout | [bookstore-ui-pages](../../book-store/ui-pages.md) |
| `/bookstore/orders` | OrderHistoryView | BookstoreLayout | [bookstore-ui-pages](../../book-store/ui-pages.md) |
| `/bookstore/seller` | SellerDashboardView | BookstoreLayout | [bookstore-ui-pages](../../book-store/ui-pages.md) |
| `/bookstore/checkout/success` | CheckoutSuccessView | BookstoreLayout | [bookstore-ui-pages](../../book-store/ui-pages.md) |
| `/bookstore/checkout/cancel` | CheckoutCancelView | BookstoreLayout | [bookstore-ui-pages](../../book-store/ui-pages.md) |

## Trang standalone

Các standalone pages không sử dụng `MainLayoutTemplate`:

- **LoginView** (`/login`): Biểu mẫu đăng nhập, không có sidebar hay topbar.
- **SignUpView** (`/signup`): Biểu mẫu đăng ký.
- **DrawingView** (`/draw`): Công cụ vẽ với Konva.js, toàn màn hình.
- **AIView** (`/ai`): Trang test tính năng AI.
- **AuthCallbackView** (`/auth/callback`): Xử lý callback OAuth (Google, Facebook).

## Bookstore Layout

Tất cả các trang bookstore (`/bookstore*`) đều sử dụng `BookstoreLayout` — layout riêng của microservice bookstore, không dùng `MainLayoutTemplate`. Xem chi tiết tại [docs/book-store/ui-pages.md](../../book-store/ui-pages.md).

Hình 1: Sơ đồ các route chính trong hệ thống IlluWrl.
