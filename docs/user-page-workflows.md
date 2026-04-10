# User Page Workflows (Theo Từng Trang)

## 1. Mục tiêu tài liệu

Tài liệu này mô tả luồng sử dụng theo từng page của frontend:

- Người dùng thấy gì trên trang.
- Có nút/chức năng nào chính.
- Khi bấm vào thì điều gì xảy ra.
- Trang nào yêu cầu đăng nhập và hành vi redirect.

Phạm vi: frontend hiện tại trong `frontend/src/views` và layout dùng chung.

## 2. Luồng dùng chung (mọi trang có MainLayoutTemplate)

### 2.1 Top bar

- Nút menu (biểu tượng bars): mở/đóng sidebar trái.
- Logo IlluWrl: về Home (`/`).
- Ô tìm kiếm: nhập từ khóa rồi Enter, chuyển sang Feed (`/feed?q=...`).
- Nút Media: mở menu chọn phạm vi tìm kiếm (Illustrations and Manga, Novels, User).
- Nút More (ellipsis): mở modal Search option; bấm Apply sẽ chuyển sang `/feed` kèm query nâng cao (`qall`, `qany`, `qnot`, `target`, `type`).
- Nút Premium Free Trial: chuyển tới `/signup`.
- Nút Post: mở menu chọn loại bài đăng, điều hướng tới:
  - Illustration -> `/upload/illust`
  - Manga -> `/upload/manga`
  - Ugoira -> `/upload/ugoira`
  - Novel -> `/upload/novel`
- Nút Messages: vào `/messages`.
- Nút Notifications: vào `/notifications`.
- Avatar user (khi đã đăng nhập): mở user menu, có các lối tắt Dashboard/My works/Messages/Favorites/Bookmarks/Settings và nút Log out.
- Nút Log in (khi chưa đăng nhập): vào `/login`.
- Nút Related services (grid 9 chấm): mở menu dịch vụ, mỗi item điều hướng sang page tương ứng (Feed, Rankings, Favorites, Bookmarks, Upload).

### 2.2 Sidebar trái

- Danh mục chính điều hướng nhanh tới Home, Feed theo type, Favorites, Rankings, Messages.
- Nút “Yeu cau dang nhap” chuyển đến `/login`.
- Bấm ra ngoài sidebar (backdrop) sẽ đóng sidebar.

## 3. Workflow theo từng page

## 3.1 HomePage (`/`)

- Thành phần chính: tag strip, tabs, hero banner, lưới artwork đề xuất.
- Nút/tương tác:
  - Tag trên HomeTagStrip: chuyển tới `TagDetailView` (`/tags/:tagName`).
  - Tabs Home/Illustrations/Manga/Novels: điều hướng giữa `/` và `/feed?type=...`.
  - Artwork card (ảnh hoặc tiêu đề): vào chi tiết artwork (`/artworks/:id`).
  - View all trong khối Recommended works: sang `/feed`.
- Kết quả hiển thị:
  - Nếu API artworks/tags lỗi hoặc rỗng thì hiện trạng thái rỗng phù hợp.

## 3.2 FeedView (`/feed`)

- Mục tiêu: tìm kiếm/lọc danh sách artwork.
- Nút/tương tác:
  - Show tag/Hide tag: bật tắt dải tag liên quan.
  - Search option: mở modal lọc nâng cao.
  - Order select (Newest/Sort by popularity): đổi thứ tự hiển thị local.
  - Card artwork (ảnh, tiêu đề): vào `/artworks/:id`.
- Kết quả hiển thị:
  - Loading: “Loading results...”
  - Error: hiện message lỗi.
  - Empty: “No search result found.”

## 3.3 RankingsView (`/rankings`)

- Mục tiêu: xem bảng xếp hạng theo kỳ.
- Nút/tương tác:
  - Tabs Daily/Weekly/Monthly: cập nhật query `period` và gọi lại API ranking.
  - Card ở Top 3 và danh sách hạng dưới: bấm vào ảnh/tiêu đề để sang `/artworks/:id`.
- Kết quả hiển thị:
  - Loading/Error/No data theo trạng thái store.

## 3.4 TagDetailView (`/tags/:tagName`)

- Mục tiêu: xem tất cả artwork thuộc tag.
- Nút/tương tác:
  - Các card trong lưới dùng HomeArtworkGrid: bấm ảnh/tiêu đề để vào `/artworks/:id`.
- Kết quả hiển thị:
  - Hiện tổng số artwork theo tag.
  - Có trạng thái loading/error/empty.

## 3.5 ArtworkDetailView (`/artworks/:id`)

- Mục tiêu: xem chi tiết bài đăng và tương tác.
- Nút/tương tác chính:
  - Nút tim: like/unlike.
  - Nút bookmark: bookmark/unbookmark.
  - Nút Follow: follow/unfollow tác giả.
  - Tag trong bài: vào trang tag (`/tags/:tagName`).
  - Open comments page: sang `/artworks/:id/comments`.
  - Related works: bấm ảnh/tiêu đề để chuyển sang artwork khác.
- Hành vi quan trọng:
  - Nếu chưa đăng nhập mà bấm like/bookmark/follow thì chuyển về `/login?redirect=<current-page>`.
  - Counter hiển thị (view/like/bookmark/comment) cập nhật theo trạng thái toggle.

## 3.6 ArtworkCommentsView (`/artworks/:id/comments`)

- Mục tiêu: thêm, xem, xóa comment của artwork.
- Nút/tương tác:
  - Add comment: gửi comment mới.
  - Delete trên từng comment (nếu có quyền): xóa comment.
- Kết quả hiển thị:
  - Loading/Error hoặc danh sách comment từ API.

## 3.7 BookmarksView (`/bookmarks`) [cần đăng nhập]

- Mục tiêu: quản lý bookmark cá nhân.
- Nút/tương tác:
  - Add: thêm bookmark theo `artworkId` và `folder`.
  - Delete latest: xóa phần tử bookmark đầu danh sách hiện tại.
- Kết quả hiển thị:
  - Hiện danh sách bookmarks hoặc thông báo lỗi từ store.

## 3.8 FavoritesView (`/favorites`) [cần đăng nhập]

- Mục tiêu: xem các artwork đã like.
- Nút/tương tác:
  - Type tabs (Illustration/Manga/Novel/Ugoira): lọc favorites theo loại.
  - Remove ở từng card: bỏ like item đó.
  - Delete latest: xóa item đầu danh sách favorites.
  - Card artwork: vào `/artworks/:id`.
- Kết quả hiển thị:
  - Có overview số item và tổng likes theo filter hiện tại.
  - Nếu chưa đăng nhập: hiện nút Go to login.

## 3.9 MessagesView (`/messages`) [cần đăng nhập]

- Mục tiêu: inbox/sent và gửi tin nhắn.
- Nút/tương tác:
  - Inbox/Sent: chuyển box và gọi API tương ứng.
  - Send: gửi message theo recipientId + content.
  - Mark read (trong inbox): đánh dấu đã đọc.
- Kết quả hiển thị:
  - Header hiển thị số unread.
  - Có loading/error/empty state.
  - Nếu chưa đăng nhập: hiện nút Go to login.

## 3.10 NotificationsView (`/notifications`) [cần đăng nhập]

- Mục tiêu: xem timeline thông báo.
- Nút/tương tác:
  - Checkbox Unread only: lọc thông báo chưa đọc.
  - Refresh: tải lại danh sách.
  - Mark read: đánh dấu đã đọc.
  - Open related artwork: đi tới artwork liên quan nếu có.
- Kết quả hiển thị:
  - Hiển thị unread count, loading/error/empty state.
  - Nếu chưa đăng nhập: hiện nút Go to login.

## 3.11 AccountView (`/account`)

- Mục tiêu: trang profile tổng hợp theo tab.
- Nút/tương tác:
  - Tabs Home/Illustrations/Bookmarks: đổi section nội dung.
  - Type tabs trong Works/Bookmarks: lọc theo loại artwork.
  - View profile: điều hướng về chính `/account`.
  - Edit profile, Share profile, Edit cover: hiện là UI action (chưa nối API trong view này).
  - Card artwork/bookmark: vào `/artworks/:id`.
- Kết quả hiển thị:
  - Nếu chưa đăng nhập: hiện thông báo + Go to login.

## 3.12 DashboardView (`/dashboard`) [cần đăng nhập]

- Mục tiêu: dashboard creator.
- Nút/tương tác:
  - Tabs dashboard: đổi tab hiển thị (UI tab).
  - Nút Post trong khối recently uploaded: chuyển tới `/upload/illust`.
  - Coachmark Next/Try it now: chuyển bước onboarding và đóng overlay.
- Kết quả hiển thị:
  - Loading/Error dashboard data.
  - Nếu chưa đăng nhập: hiện Go to login.

## 3.13 UploadArtworkView (`/upload/:kind`) [cần đăng nhập]

- Mục tiêu: đăng bài theo 4 loại (illust, manga, ugoira, novel).
- Nút/tương tác:
  - Type tabs: đổi loại upload và reset form theo loại.
  - Input file upload:
    - Illust/Manga/Ugoira: upload ảnh bài đăng.
    - Novel: upload ảnh cover.
  - Tag input + Add + Enter/Comma: thêm tag (tối đa 10), bấm tag-pill để xóa.
  - Các radio/checkbox cài đặt (age rating, AI-generated, visibility, comments, schedule, language).
  - Nút Post: gửi dữ liệu tạo artwork.
  - Nút Reset (media pages): reset form.
  - Nút Save draft/Preview (novel): hiện thông báo chưa hỗ trợ.
- Kết quả hiển thị:
  - Validation lỗi hiển thị theo rule trong view.
  - Thành công hiển thị “Post created successfully.”

## 3.14 SignUpView (`/signup`)

- Mục tiêu: tạo tài khoản mới.
- Nút/tương tác:
  - Social buttons: hiện UI social sign-up (chưa nối backend OAuth trong view này).
  - Sign up with an e-mail address: mở/đóng form email.
  - Create account: gọi register, thành công chuyển `/account`.
  - Link Log in: chuyển `/login`.
- Kết quả hiển thị:
  - Lỗi validate hoặc lỗi từ auth store hiển thị ngay trên form.

## 3.15 LoginView (`/login`)

- Mục tiêu: đăng nhập tài khoản.
- Nút/tương tác:
  - Social icon buttons: hiện UI social login (chưa nối backend OAuth).
  - Log in: gọi API login.
  - Link Create account: chuyển `/signup`.
- Hành vi redirect:
  - Nếu có `?redirect=...` thì login thành công sẽ quay về URL đó.
  - Nếu không có redirect thì về `/account`.

## 3.16 NotFoundView (`/:pathMatch(.*)*`)

- Mục tiêu: xử lý route không tồn tại.
- Nút/tương tác:
  - Back to home: về `/`.
  - Go to feed: về `/feed`.

## 4. Route yêu cầu đăng nhập và redirect

- Các route có `requiresAuth`: `/bookmarks`, `/favorites`, `/messages`, `/notifications`, `/upload`, `/upload/:kind`, `/dashboard`.
- Nếu chưa đăng nhập:
  - Router guard chuyển về `/login`.
  - Giữ query `redirect` để quay lại đúng trang sau khi login.

## 5. Gợi ý sử dụng tài liệu cho agent

1. Khi phân tích bug theo page, đọc mục page tương ứng để biết điểm bấm và expected outcome.
2. Khi sửa flow auth, kiểm tra cả guard redirect và nút yêu cầu login trong từng page.
3. Khi chỉnh API tương tác (like/bookmark/follow/comment), đối chiếu lại các page dùng chung hành vi đó để tránh lệch UX.
