# Frontend Page Checklist

Mục tiêu: theo dõi danh sách trang frontend đã có và các trang cần xây dựng tiếp theo từ feature tracker.

## Tổng quan

- Total pages tracked: 26
- Last updated: 2026-04-17
- Owner: gem-designer

## Hiện tại (Đã có)

- [x] HomePage - `/` - trang chủ discovery + tags + hero
- [x] FeedView - `/feed` - explore artwork + search/filter type
- [x] BookmarksView - `/bookmarks` - danh sách bookmark của user
- [x] RankingsView - `/rankings` - ranking theo period
- [x] ArtworkDetailView - `/artworks/:id` - chi tiết artwork + related
- [x] ArtworkCommentsView - `/artworks/:id/comments` - danh sách comment theo artwork
- [x] TagDetailView - `/tags/:tagName` - danh sách artwork theo tag
- [x] NotFoundView - `/:pathMatch(.*)*` - trang lỗi route không tồn tại
- [x] MessagesView - `/messages` - inbox/sent + compose + mark-read với backend API
- [x] NotificationsView - `/notifications` - timeline thông báo + unread filter + mark-read với backend API
- [x] AccountView - `/account` - profile/account + session info + logout
- [x] DashboardView - `/dashboard` - creator dashboard and reaction summary
- [x] FavoritesView - `/favorites` - My Favorite list from liked artworks
- [x] SignUpView - `/signup` - đăng ký tài khoản bằng email/password
- [x] LoginView - `/login` - đăng nhập tài khoản bằng email/password

## Tương lai (Theo Feature Tracker)

### Phase 2: Moderation & Reporting Workflow (Planned)

- [ ] ReportCreateView - `/reports/new` - user gửi báo cáo artwork/comment/user
- [ ] MyReportsView - `/reports` - user theo dõi danh sách report đã gửi
- [ ] ReportDetailView - `/reports/:id` - xem trạng thái report và timeline xử lý
- [ ] ModerationQueueView - `/moderation/reports` - hàng đợi report cho moderator
- [ ] ModerationCaseDetailView - `/moderation/reports/:id` - chi tiết case + hành động xử lý

### Phase 3: AI Auto-tagging, Captioning, Recommendation (Planned)

- [ ] UploadAssistantView - `/upload/assistant` - gợi ý tag/caption AI khi đăng bài
- [ ] RecommendationFeedView - `/recommendations` - feed gợi ý cá nhân hóa
- [ ] RecommendationSettingsView - `/settings/recommendations` - cấu hình gợi ý
- [ ] CaptionSuggestionHistoryView - `/ai/captions` - lịch sử caption AI đã tạo

### Phase 3: AI Detection Labeling + Art Assistant (Planned)

- [ ] AIDetectionReviewView - `/moderation/ai-detection` - review kết quả AI detection
- [ ] ArtworkLabelingView - `/artworks/:id/labels` - gán/kiểm tra nhãn nội dung
- [ ] ArtAssistantChatView - `/assistant/art` - chat với trợ lý AI cho ý tưởng vẽ tranh
- [ ] ArtAssistantSessionView - `/assistant/art/:sessionId` - chi tiết từng phiên chat/tư vấn

## Note

- Danh sách page tương lai được trích từ các feature Planned trong `docs/tasks/feature-tracker.md`.
- HomePage hiện sử dụng artwork mới nhất từ API (`/api/artworks?limit=24`), không phụ thuộc seed mock.
- Trước khi implement từng page, cần bổ sung contract API + route guard + metadata điều hướng.
- Ưu tiên thứ tự: Moderation/Reporting trước, sau đó đến AI pages.
- Đã đối chiếu parity FE/BE ngày 2026-04-08: các gap Follow API và Messages/Notifications API đã được tích hợp.
- Đã cập nhật parity comment ngày 2026-04-17: luồng reply thread + Display Replies + sticker comment trên trang chi tiết artwork đã hoạt động và có screenshot MCP.
